import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import { createChallenge, verifyChallenge } from "../services/otpService.js";

// Send OTP
export const sendOtp = async (req, res) => {
  try {
    const { mobile, purpose } = req.body;

    if (!mobile || !/^\d{10}$/.test(mobile)) {
      return res.status(400).json({ success: false, message: "Valid 10-digit mobile number is required." });
    }

    if (!["login", "signup"].includes(purpose)) {
      return res.status(400).json({ success: false, message: "Invalid purpose." });
    }

    // Account rules
    if (purpose === "login") {
      const existingUser = await User.findOne({ mobile });
      if (!existingUser) {
        // Return generic error to avoid account enumeration
        return res.status(400).json({ success: false, message: "Failed to send OTP. Please check the mobile number or sign up first." });
      }
    } else if (purpose === "signup") {
      const existingUser = await User.findOne({ mobile });
      if (existingUser) {
        return res.status(409).json({ success: false, message: "Mobile number already registered." });
      }
    }

    await createChallenge(mobile, purpose);

    return res.status(200).json({ success: true, message: "OTP sent successfully." });
  } catch (error) {
    console.error("sendOtp error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to send OTP." });
  }
};

// Verify OTP (generic, could be used just to check)
export const verifyOtp = async (req, res) => {
  try {
    const { mobile, purpose, otp } = req.body;

    if (!mobile || !purpose || !otp) {
      return res.status(400).json({ success: false, message: "Mobile, purpose, and OTP are required." });
    }

    await verifyChallenge(mobile, purpose, otp);

    return res.status(200).json({ success: true, message: "OTP verified successfully." });
  } catch (error) {
    console.error("verifyOtp error:", error);
    return res.status(400).json({ success: false, message: error.message || "Invalid OTP." });
  }
};

// Login with OTP
export const loginOtp = async (req, res, next) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({ success: false, message: "Mobile and OTP are required." });
    }

    // 1. Verify OTP
    await verifyChallenge(mobile, "login", otp);

    // 2. Resolve User
    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(401).json({ success: false, message: "Account not found." });
    }

    // 3. Generate JWT
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
        tokenVersion: user.tokenVersion,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // 4. Set Cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // localhost
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    // 5. Update last login
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    // 6. Response
    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
      }
    });
  } catch (error) {
    console.error("loginOtp error:", error);
    return res.status(400).json({ success: false, message: error.message || "Login failed." });
  }
};

// Verify mobile for signup and issue short-lived token
export const registerVerifyMobile = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({ success: false, message: "Mobile and OTP are required." });
    }

    // 1. Verify OTP
    await verifyChallenge(mobile, "signup", otp);

    // 2. Issue short-lived verification token
    const verificationToken = jwt.sign(
      { mobile, verified: true },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    return res.status(200).json({
      success: true,
      message: "Mobile verified successfully.",
      verificationToken
    });
  } catch (error) {
    console.error("registerVerifyMobile error:", error);
    return res.status(400).json({ success: false, message: error.message || "Verification failed." });
  }
};
