import mongoose from "mongoose";

const otpChallengeSchema = new mongoose.Schema({
  mobile: {
    type: String,
    required: true,
    index: true,
  },
  purpose: {
    type: String,
    required: true,
    enum: ["login", "signup"],
  },
  otpHash: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: "1h" }, // TTL index to auto-cleanup after 1 hour, though application logic uses precise expiration
  },
  failedAttempts: {
    type: Number,
    default: 0,
  },
  isConsumed: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const OtpChallenge = mongoose.model("OtpChallenge", otpChallengeSchema);

export default OtpChallenge;
