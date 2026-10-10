import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

/**
 * Custom error class for SMS provider issues
 */
export class SmsProviderError extends Error {
  constructor(message, { statusCode = 500, code = null, userMessage = null } = {}) {
    super(message);
    this.name = "SmsProviderError";
    this.statusCode = statusCode;
    this.code = code;
    this.userMessage = userMessage || message;
  }
}

/**
 * Mask mobile numbers for safe log output (never log full phone numbers)
 */
export const maskPhone = (phone) => {
  if (!phone || typeof phone !== "string") return "***";
  if (phone.length <= 4) return "****";
  return phone.slice(0, 3) + "****" + phone.slice(-4);
};

/**
 * Helper to dynamically initialize the Twilio client from environment variables
 */
export const getTwilioClient = () => {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  return twilio(sid, token);
};

/**
 * Retrieve Twilio Verify Service SID
 */
export const getVerifyServiceSid = () => process.env.TWILIO_VERIFY_SERVICE_SID || null;

/**
 * Map Twilio SDK errors to safe, non-sensitive, actionable user-facing messages & status codes
 */
export const mapTwilioError = (error) => {
  const code = error?.code || null;
  const rawMessage = error?.message || "Unknown SMS provider error";

  let statusCode = 502;
  let userMessage = "Unable to send verification SMS at this time. Please try again later.";

  if (code === 21608) {
    statusCode = 403;
    userMessage =
      "Cannot send SMS to this number: Twilio Trial accounts can only deliver SMS to verified numbers. Please add this number under 'Verified Caller IDs' in the Twilio Console or upgrade the Twilio account.";
  } else if (code === 60203 || code === 20429) {
    statusCode = 429;
    userMessage =
      "Too many OTP requests sent to this number. Please wait a few minutes before trying again.";
  } else if (code === 60200 || code === 21211 || code === 21614) {
    statusCode = 400;
    userMessage = "Invalid mobile number format or the number cannot receive SMS.";
  } else if (code === 20003) {
    statusCode = 503;
    userMessage = "SMS provider authentication error. Please verify Twilio API credentials.";
  } else if (code === 60410) {
    statusCode = 502;
    userMessage = "SMS delivery failed due to network or carrier rejection. Please try again.";
  }

  return new SmsProviderError(rawMessage, {
    statusCode,
    code,
    userMessage,
  });
};

/**
 * Format 10-digit mobile number into E.164 international format (+91...)
 */
export const formatIndianMobile = (mobile) => {
  const cleanNumber = String(mobile || "").replace(/\D/g, "");
  if (cleanNumber.length === 10) {
    return `+91${cleanNumber}`;
  }
  if (String(mobile).startsWith("+")) {
    return String(mobile).trim();
  }
  return `+${cleanNumber}`;
};

/**
 * Send SMS OTP via Twilio Verify
 */
export const sendSmsOtp = async (mobile, customOtp = null) => {
  const client = getTwilioClient();
  const verifySid = getVerifyServiceSid();

  if (!client || !verifySid) {
    if (process.env.NODE_ENV === "test") {
      console.log(`[TEST MODE] Mock SMS sent to ${maskPhone(mobile)}`);
      return { success: true, mocked: true };
    }

    throw new SmsProviderError(
      "SMS provider credentials are not configured in environment variables. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID in your .env file.",
      {
        statusCode: 503,
        code: "MISSING_CREDENTIALS",
        userMessage: "SMS service credentials are not configured. Please contact the administrator.",
      }
    );
  }

  const formattedMobile = formatIndianMobile(mobile);

  try {
    const verification = await client.verify.v2
      .services(verifySid)
      .verifications.create({ to: formattedMobile, channel: "sms" });

    console.log(
      `SMS sent successfully to ${maskPhone(formattedMobile)}, SID: ${verification.sid}, Status: ${verification.status}`
    );
    return { success: true, sid: verification.sid, status: verification.status };
  } catch (error) {
    console.error(
      `[SMS Send Failed] Recipient: ${maskPhone(formattedMobile)}, Code: ${error?.code || "N/A"}, Status: ${error?.status || "N/A"}, Message: ${error?.message || "Unknown error"}`
    );
    throw mapTwilioError(error);
  }
};

/**
 * Verify SMS OTP via Twilio Verify
 */
export const verifySmsOtp = async (mobile, code) => {
  const client = getTwilioClient();
  const verifySid = getVerifyServiceSid();

  if (!client || !verifySid) {
    if (process.env.NODE_ENV === "test") {
      if (code === "123456") return true;
      return false;
    }
    throw new SmsProviderError("SMS provider credentials are not configured.", {
      statusCode: 503,
      code: "MISSING_CREDENTIALS",
      userMessage: "SMS service credentials are not configured.",
    });
  }

  const formattedMobile = formatIndianMobile(mobile);

  try {
    const verificationCheck = await client.verify.v2
      .services(verifySid)
      .verificationChecks.create({ to: formattedMobile, code: String(code).trim() });

    return verificationCheck.status === "approved";
  } catch (error) {
    const errorCode = error?.code || null;
    const errorStatus = error?.status || 500;
    console.error(
      `[SMS Verify Failed] Recipient: ${maskPhone(formattedMobile)}, Code: ${errorCode || "N/A"}, Status: ${errorStatus}, Message: ${error?.message || "Unknown error"}`
    );

    if (errorCode === 60202) {
      throw new SmsProviderError("Maximum check attempts exceeded for this verification.", {
        statusCode: 429,
        code: "MAX_CHECK_ATTEMPTS_EXCEEDED",
        userMessage: "Maximum verification attempts exceeded. Please request a new OTP.",
      });
    }

    if (errorCode === 20404) {
      // Verification not found / expired on Twilio
      return false;
    }

    return false;
  }
};
