import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import passport from "../config/passport.js";
import Fund from "../models/FundsModel.js";
import generateClientId from "../services/generateClientId.js";
// ===============================
// REGISTER USER
// ===============================
const registerUser = async (req, res) => {
      try {

            // 1. Request body se data lena
            const { name, email, mobile, password } = req.body;

            // 3. Check karna ki email already registered hai ya nahi
            const existingEmail = await User.findOne({
                  email: email.toLowerCase().trim(),
            });

            if (existingEmail) {
                  return res.status(409).json({
                        success: false,
                        message: "Email already registered",
                  });
            }

            // 4. Check karna ki mobile already registered hai ya nahi
            const existingMobile = await User.findOne({
                  mobile: mobile.trim(),
            });

            if (existingMobile) {
                  return res.status(409).json({
                        success: false,
                        message: "Mobile number already registered",
                  });
            }

            // 5. Password ko hash karna
            // Plain password database mein store nahi karna hai
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const clientId = await generateClientId();

            const user = new User({
                  name,
                  email,
                  mobile,
                  password: hashedPassword,
                  clientId,
            });

            await user.save();
            await Fund.create({
                  userId: user._id,
                  availableBalance: 0,
                  usedBalance: 0,
                  reservedBalance: 0
            });
            // 7. Successful response
            return res.status(201).json({
                  success: true,
                  message: "User registered successfully",
                  user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        mobile: user.mobile,
                        role: user.role,
                  },
            });
      } catch (error) {
            console.error("Register error:", error);

            return res.status(500).json({
                  success: false,
                  message: "Internal server error",
            });
      }
};
// ===============================
// LOGIN USER
// ===============================
// ===============================
// LOGIN USER USING PASSPORT
// ===============================
export const loginUser = async (req, res, next) => {
      passport.authenticate(
            "local",
            { session: false },
            async (error, user, info) => {

                  // 1. Technical error
                  if (error) {
                        return next(error);
                  }

                  // 2. Invalid credentials
                  if (!user) {
                        return res.status(401).json({
                              success: false,
                              message:
                                    info?.message ||
                                    "Invalid email or password",
                        });
                  }

                  // 3. JWT token generate karna
                  const token = jwt.sign(
                        {
                              userId: user._id.toString(),
                              role: user.role,
                              tokenVersion: user.tokenVersion,
                        },
                        process.env.JWT_SECRET,
                        {
                              expiresIn: "1d",
                        }
                  );

                  // 4. Cookie set karna
                  res.cookie("token", token, {
                        httpOnly: true,
                        secure: false, // localhost ke liye
                        sameSite: "lax",
                        maxAge: 24 * 60 * 60 * 1000,
                  });

                  // 5. Last login update
                  try {
                        await User.findByIdAndUpdate(user._id, {
                              lastLogin: new Date(),
                        });
                  } catch (error) {
                        return next(error);
                  }

                  // 6. Response
                  return res.status(200).json({
                        success: true,
                        message: "Login successful",
                  });
            }
      )(req, res, next);
};

const logoutUser = (req, res) => {
      res.clearCookie("token", {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
      });

      return res.status(200).json({
            success: true,
            message: "Logout successful",
      });
};
const getCurrentUser = async (req, res) => {
      try {
            const user = await User.findById(req.user.userId).select(
                  "name email mobile clientId status role"
            );

            if (!user) {
                  return res.status(404).json({
                        success: false,
                        message: "User not found"
                  });
            }

            return res.status(200).json({
                  success: true,
                  user
            });

      } catch (error) {
            return res.status(500).json({
                  success: false,
                  message: "Failed to fetch user"
            });
      }
};
const updateProfile = async (req, res) => {
      try {
            const { name, mobile } = req.body;

            if (!name || !mobile) {
                  return res.status(400).json({
                        success: false,
                        message: "Name and mobile are required",
                  });
            }

            const trimmedName = name.trim();
            const trimmedMobile = mobile.trim();

            // Check if mobile already belongs to another user
            const existingUser = await User.findOne({
                  mobile: trimmedMobile,
                  _id: { $ne: req.user.userId },
            });

            if (existingUser) {
                  return res.status(400).json({
                        success: false,
                        message: "This mobile number is already registered",
                  });
            }

            const updatedUser = await User.findByIdAndUpdate(
                  req.user.userId,
                  {
                        name: trimmedName,
                        mobile: trimmedMobile,
                  },
                  {
                        returnDocument: "after",
                        runValidators: true,
                  },
            ).select(
                  "name email mobile clientId status role lastLogin",
            );

            if (!updatedUser) {
                  return res.status(404).json({
                        success: false,
                        message: "User not found",
                  });
            }

            return res.status(200).json({
                  success: true,
                  message: "Profile updated successfully",
                  user: updatedUser,
            });

      } catch (error) {
            console.error("Update profile error:", error);

            // MongoDB duplicate key safety check
            if (error.code === 11000) {
                  return res.status(400).json({
                        success: false,
                        message: "This mobile number is already registered",
                  });
            }

            return res.status(500).json({
                  success: false,
                  message: "Failed to update profile",
            });
      }
};
const changePassword = async (req, res) => {
      try {
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                  return res.status(400).json({
                        success: false,
                        message: "Current password and new password are required",
                  });
            }

            if (newPassword.length < 8) {
                  return res.status(400).json({
                        success: false,
                        message: "New password must be at least 8 characters",
                  });
            }

            // Current logged-in user
            const user = await User.findById(req.user.userId).select("+password");

            if (!user) {
                  return res.status(404).json({
                        success: false,
                        message: "User not found",
                  });
            }

            // Check current password
            const isPasswordCorrect = await bcrypt.compare(
                  currentPassword,
                  user.password
            );

            if (!isPasswordCorrect) {
                  return res.status(401).json({
                        success: false,
                        message: "Current password is incorrect",
                  });
            }

            // Check new password is different
            const isSamePassword = await bcrypt.compare(
                  newPassword,
                  user.password
            );

            if (isSamePassword) {
                  return res.status(400).json({
                        success: false,
                        message: "New password must be different from current password",
                  });
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 12);

            user.password = hashedPassword;

            await user.save();

            return res.status(200).json({
                  success: true,
                  message: "Password changed successfully",
            });

      } catch (error) {
            console.error("Change password error:", error);

            return res.status(500).json({
                  success: false,
                  message: "Failed to change password",
            });
      }
};
const logoutOtherSessions = async (req, res) => {
      try {
            await User.findByIdAndUpdate(
                  req.user.userId,
                  {
                        $inc: {
                              tokenVersion: 1,
                        },
                  },
            );

            // New token for current session
            const user = await User.findById(req.user.userId).select(
                  "role tokenVersion",
            );

            const newToken = jwt.sign(
                  {
                        userId: user._id.toString(),
                        role: user.role,
                        tokenVersion: user.tokenVersion,
                  },
                  process.env.JWT_SECRET,
                  {
                        expiresIn: "1d",
                  },
            );

            res.cookie("token", newToken, {
                  httpOnly: true,
                  secure: false,
                  sameSite: "lax",
                  maxAge: 24 * 60 * 60 * 1000,
            });

            return res.status(200).json({
                  success: true,
                  message: "All other sessions have been logged out.",
            });
      } catch (error) {
            console.error(error);

            return res.status(500).json({
                  success: false,
                  message: "Failed to logout other sessions.",
            });
      }
};
const deleteAccount = async (req, res) => {
      try {
            const { password } = req.body;

            if (!password) {
                  return res.status(400).json({
                        success: false,
                        message: "Password is required.",
                  });
            }

            const user = await User.findById(req.user.userId).select(
                  "+password",
            );

            if (!user) {
                  return res.status(404).json({
                        success: false,
                        message: "User not found.",
                  });
            }

            const passwordCorrect = await bcrypt.compare(
                  password,
                  user.password,
            );

            if (!passwordCorrect) {
                  return res.status(401).json({
                        success: false,
                        message: "Incorrect password.",
                  });
            }

            await User.findByIdAndDelete(req.user.userId);

            res.clearCookie("token", {
                  httpOnly: true,
                  secure: false,
                  sameSite: "lax",
            });

            return res.status(200).json({
                  success: true,
                  message: "Account deleted successfully.",
            });
      } catch (error) {
            console.error(error);

            return res.status(500).json({
                  success: false,
                  message: "Failed to delete account.",
            });
      }
};
export default { registerUser, loginUser, logoutUser, getCurrentUser, updateProfile, changePassword, logoutOtherSessions, deleteAccount };