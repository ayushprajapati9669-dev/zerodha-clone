import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID; // Used for Twilio Verify

// We initialize the client only if credentials exist, otherwise we mock/throw errors appropriately.
let client = null;
if (accountSid && authToken && verifyServiceSid) {
  client = twilio(accountSid, authToken);
}

export const sendSmsOtp = async (mobile, customOtp = null) => {
  if (!client) {
    if (process.env.NODE_ENV === "test") {
      // For tests, simulate success
      console.log(`[TEST MODE] Mock SMS sent to ${mobile}`);
      return { success: true, mocked: true };
    }
    
    // Throw an error if credentials are not configured
    throw new Error(
      "SMS provider credentials are not configured in environment variables. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID in your .env file."
    );
  }

  try {
    const formattedMobile = mobile.startsWith("+91") ? mobile : `+91${mobile}`;
    
    // Twilio Verify handles OTP generation and templating (DLT-compliant for India automatically)
    const verification = await client.verify.v2
      .services(verifyServiceSid)
      .verifications.create({ to: formattedMobile, channel: "sms" });
      
    console.log(`SMS sent successfully to ${formattedMobile}, SID: ${verification.sid}, Status: ${verification.status}`);
    return { success: true, sid: verification.sid };
  } catch (error) {
    console.error("SMS sending failed:", error);
    throw new Error("Failed to send OTP via SMS provider.");
  }
};

export const verifySmsOtp = async (mobile, code) => {
  if (!client) {
    if (process.env.NODE_ENV === "test") {
      // For tests, simulate success if code is 123456
      if (code === "123456") return true;
      return false;
    }
    throw new Error("SMS provider credentials are not configured.");
  }

  try {
    const formattedMobile = mobile.startsWith("+91") ? mobile : `+91${mobile}`;
    const verificationCheck = await client.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({ to: formattedMobile, code });
      
    return verificationCheck.status === "approved";
  } catch (error) {
    console.error("SMS verification failed:", error);
    return false; // Invalid or expired at Twilio level
  }
};
