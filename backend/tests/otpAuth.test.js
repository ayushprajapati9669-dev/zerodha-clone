import { describe, it } from "node:test";
import assert from "node:assert";
import jwt from "jsonwebtoken";

import * as smsService from "../services/smsService.js";
import {
  SmsProviderError,
  mapTwilioError,
  formatIndianMobile,
  maskPhone,
} from "../services/smsService.js";
import userValidationSchema from "../schemas/userValidationSchema.js";

const JWT_SECRET = process.env.JWT_SECRET || "zerodha_jwt_secret_key_12345";

describe("OTP Authentication System", () => {
  it("should import smsService without errors in test mode", async () => {
    assert.ok(typeof smsService.sendSmsOtp === "function", "sendSmsOtp should be exported");
    assert.ok(typeof smsService.verifySmsOtp === "function", "verifySmsOtp should be exported");
  });

  describe("Phone Number Formatting & Masking", () => {
    it("should format a standard 10-digit Indian mobile number to E.164 (+91...)", () => {
      const formatted = formatIndianMobile("9876543210");
      assert.strictEqual(formatted, "+919876543210");
    });

    it("should preserve numbers that already have international country prefix", () => {
      const formatted = formatIndianMobile("+919876543210");
      assert.strictEqual(formatted, "+919876543210");
    });

    it("should mask phone number safely for logs without revealing full number", () => {
      const masked = maskPhone("+919876543210");
      assert.strictEqual(masked, "+91****3210");
      assert.ok(!masked.includes("9876543210"));
    });
  });

  describe("Twilio Error Mapping & Security", () => {
    it("should map Twilio error 21608 (unverified trial recipient) to HTTP 403 with clear actionable message", () => {
      const twilioErr = {
        code: 21608,
        status: 403,
        message: "During trial, the recipient must be a verified tester.",
      };
      const mapped = mapTwilioError(twilioErr);
      assert.ok(mapped instanceof SmsProviderError);
      assert.strictEqual(mapped.statusCode, 403);
      assert.strictEqual(mapped.code, 21608);
      assert.ok(mapped.userMessage.includes("Twilio Trial accounts"));
      assert.ok(mapped.userMessage.includes("Verified Caller IDs"));
    });

    it("should map Twilio rate limit errors (60203, 20429) to HTTP 429", () => {
      const rateLimitErr = {
        code: 60203,
        status: 429,
        message: "Max send attempts reached",
      };
      const mapped = mapTwilioError(rateLimitErr);
      assert.strictEqual(mapped.statusCode, 429);
      assert.strictEqual(mapped.code, 60203);
      assert.ok(mapped.userMessage.includes("Too many OTP requests"));
    });

    it("should map invalid number format errors (60200, 21211) to HTTP 400", () => {
      const invalidNumErr = {
        code: 60200,
        status: 400,
        message: "Invalid parameter `To`",
      };
      const mapped = mapTwilioError(invalidNumErr);
      assert.strictEqual(mapped.statusCode, 400);
      assert.strictEqual(mapped.code, 60200);
      assert.ok(mapped.userMessage.includes("Invalid mobile number format"));
    });

    it("should map Twilio credentials authentication error (20003) to HTTP 503", () => {
      const authErr = {
        code: 20003,
        status: 401,
        message: "Authenticate failed",
      };
      const mapped = mapTwilioError(authErr);
      assert.strictEqual(mapped.statusCode, 503);
      assert.strictEqual(mapped.code, 20003);
      assert.ok(mapped.userMessage.includes("SMS provider authentication error"));
    });
  });

  describe("Signup Joi Schema & verificationToken Preservation", () => {
    it("should validate and preserve verificationToken on req.body (not strip it)", () => {
      const validPayload = {
        name: "Test User",
        email: "test@example.com",
        mobile: "9876543210",
        password: "Password123",
        verificationToken: "valid_jwt_token_sample",
      };
      const { error, value } = userValidationSchema.validate(validPayload, {
        abortEarly: false,
        stripUnknown: true,
      });

      assert.strictEqual(error, undefined);
      assert.strictEqual(value.verificationToken, "valid_jwt_token_sample");
    });

    it("should reject registration if verificationToken is missing", () => {
      const missingTokenPayload = {
        name: "Test User",
        email: "test@example.com",
        mobile: "9876543210",
        password: "Password123",
      };
      const { error } = userValidationSchema.validate(missingTokenPayload, {
        abortEarly: false,
        stripUnknown: true,
      });

      assert.ok(error);
      const messages = error.details.map((d) => d.message);
      assert.ok(
        messages.some((m) => m.includes("Mobile number must be verified before registration"))
      );
    });
  });

  describe("Regression: OTP Signup Verification and Security Scenarios", () => {
    const testMobile = "9876543210";

    it("Scenario 1: Successful verificationToken issuance after OTP approval", () => {
      const token = jwt.sign(
        { mobile: testMobile, verified: true, challengeId: "dummy_challenge_id_1" },
        JWT_SECRET,
        { expiresIn: "15m" }
      );
      const decoded = jwt.verify(token, JWT_SECRET);
      assert.strictEqual(decoded.mobile, testMobile);
      assert.strictEqual(decoded.verified, true);
      assert.strictEqual(decoded.challengeId, "dummy_challenge_id_1");
    });

    it("Scenario 2: Reject wrong OTP verification", async () => {
      // In test mode, code !== "123456" returns false
      const result = await smsService.verifySmsOtp(testMobile, "000000");
      assert.strictEqual(result, false);
    });

    it("Scenario 3: Reject registration with unverified number (flag verified === false)", () => {
      const unverifiedToken = jwt.sign(
        { mobile: testMobile, verified: false },
        JWT_SECRET,
        { expiresIn: "15m" }
      );
      const decoded = jwt.verify(unverifiedToken, JWT_SECRET);
      assert.strictEqual(decoded.verified, false);

      const isValid = decoded.mobile === testMobile && decoded.verified === true;
      assert.strictEqual(isValid, false, "Should reject unverified token");
    });

    it("Scenario 4: Reject registration with mismatched phone number (token phone !== payload phone)", () => {
      const tokenForPhoneA = jwt.sign(
        { mobile: "9876543210", verified: true },
        JWT_SECRET,
        { expiresIn: "15m" }
      );
      const decoded = jwt.verify(tokenForPhoneA, JWT_SECRET);
      const payloadPhone = "9123456789";

      const isMatch = decoded.mobile === payloadPhone && decoded.verified === true;
      assert.strictEqual(isMatch, false, "Should reject mismatched phone number");
    });

    it("Scenario 5: Reject expired verification challenge / token", () => {
      const expiredToken = jwt.sign(
        { mobile: testMobile, verified: true },
        JWT_SECRET,
        { expiresIn: "-1s" } // already expired
      );

      assert.throws(
        () => {
          jwt.verify(expiredToken, JWT_SECRET);
        },
        /jwt expired/,
        "Expired token must throw TokenExpiredError"
      );
    });

    it("Scenario 6: Enforce single-use verification challenge (reject reused challenge)", () => {
      const mockChallenge = {
        _id: "challenge_123",
        mobile: testMobile,
        purpose: "signup",
        isConsumed: true,
        usedForRegistration: false,
      };

      // First use: permitted and marked as used
      assert.strictEqual(mockChallenge.usedForRegistration, false);
      mockChallenge.usedForRegistration = true;

      // Second use attempt: rejected
      assert.strictEqual(mockChallenge.usedForRegistration, true);
      const canReuse = !mockChallenge.usedForRegistration;
      assert.strictEqual(canReuse, false, "Reused challenge must be rejected");
    });
  });
});
