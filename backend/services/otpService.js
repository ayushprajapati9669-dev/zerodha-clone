import crypto from "crypto";
import bcrypt from "bcryptjs";
import OtpChallenge from "../models/OtpChallengeModel.js";
import { sendSmsOtp, verifySmsOtp } from "./smsService.js";

const OTP_EXPIRY_MINUTES = 5;
const MAX_FAILED_ATTEMPTS = 5;

// Create a new OTP challenge and send SMS via Twilio Verify
export const createChallenge = async (mobile, purpose) => {
  // Check for recent requests (rate limit)
  const fiveMinutesAgo = new Date(Date.now() - OTP_EXPIRY_MINUTES * 60 * 1000);
  const recentChallenges = await OtpChallenge.countDocuments({
    mobile,
    purpose,
    createdAt: { $gte: fiveMinutesAgo },
  });

  if (recentChallenges >= 3) {
    throw new Error("Too many OTP requests. Please try again later.");
  }

  // With Twilio Verify, we don't generate the OTP locally, but we store a dummy hash 
  // to satisfy the model schema and track rate limits.
  const salt = await bcrypt.genSalt(10);
  const otpHash = await bcrypt.hash("TWILIO_VERIFY", salt);

  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Mark older active challenges for this mobile and purpose as consumed
  await OtpChallenge.updateMany(
    { mobile, purpose, isConsumed: false },
    { $set: { isConsumed: true } }
  );

  const challenge = new OtpChallenge({
    mobile,
    purpose,
    otpHash,
    expiresAt,
  });

  await challenge.save();

  // Send the SMS via Twilio Verify
  try {
    // Twilio Verify handles generating the actual code, we pass null for customOtp
    await sendSmsOtp(mobile, null);
  } catch (error) {
    // If SMS fails to send (e.g., missing credentials), remove the challenge
    await OtpChallenge.findByIdAndDelete(challenge._id);
    throw error;
  }

  return challenge;
};

// Verify the OTP via Twilio Verify
export const verifyChallenge = async (mobile, purpose, otp) => {
  // Find the latest active challenge
  const challenge = await OtpChallenge.findOne({
    mobile,
    purpose,
    isConsumed: false,
  }).sort({ createdAt: -1 });

  if (!challenge) {
    throw new Error("No active OTP challenge found.");
  }

  if (new Date() > challenge.expiresAt) {
    challenge.isConsumed = true;
    await challenge.save();
    throw new Error("OTP has expired.");
  }

  if (challenge.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    challenge.isConsumed = true;
    await challenge.save();
    throw new Error("Maximum verification attempts exceeded. Please request a new OTP.");
  }

  // Use Twilio Verify Check API
  const isValid = await verifySmsOtp(mobile, otp);

  if (!isValid) {
    challenge.failedAttempts += 1;
    await challenge.save();
    throw new Error("Invalid OTP.");
  }

  // Mark as consumed on success
  challenge.isConsumed = true;
  await challenge.save();

  return true;
};
