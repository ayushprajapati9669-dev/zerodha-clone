import express from "express"
import data from '../controller/authController.js'

import isLoggedIn from "../middleware/isLoggedInMiddleware.js"
import validateUser from "../middleware/validateUser.js";
const { registerUser, loginUser, logoutUser, getCurrentUser, updateProfile, changePassword, logoutOtherSessions,deleteAccount } = data
import { sendOtp, verifyOtp, loginOtp, registerVerifyMobile } from "../controller/otpAuthController.js";
const router = express.Router()

router.post("/register", validateUser, registerUser)
router.post("/login", loginUser);

// OTP Auth Routes
router.post("/otp/send", sendOtp);
router.post("/otp/verify", verifyOtp);
router.post("/login/otp", loginOtp);
router.post("/register/verify-mobile", registerVerifyMobile);

router.post("/logout", logoutUser)
router.post(
      "/logout-other-sessions",
      isLoggedIn,
      logoutOtherSessions,
);
router.put("/profile", isLoggedIn, updateProfile);
router.put(
      "/password",
      isLoggedIn,
      changePassword
);
router.get("/me", isLoggedIn, getCurrentUser);
router.delete(
      "/account",
      isLoggedIn,
      deleteAccount,
);

export default router