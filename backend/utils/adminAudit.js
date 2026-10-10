/**
 * Safe Admin Audit Logging
 * Ensures that administrative actions are tracked with timestamps, admin ID,
 * action type, and target, without leaking passwords, tokens, OTPs, or private codes.
 */

export const logAdminAction = ({
  adminId,
  action,
  targetType,
  targetId,
  details = {},
}) => {
  const timestamp = new Date().toISOString();
  const safeDetails = { ...details };

  // Sanitize sensitive fields if present
  const sensitiveKeys = [
    "password",
    "token",
    "jwt",
    "otp",
    "secret",
    "apiKey",
    "inviteCode",
    "authorization",
  ];
  for (const key of sensitiveKeys) {
    if (key in safeDetails) {
      safeDetails[key] = "[REDACTED]";
    }
  }

  console.log(
    `[ADMIN AUDIT] ${timestamp} | Admin: ${adminId || "SYSTEM"} | Action: ${action} | Target: ${targetType}:${targetId} | Meta: ${JSON.stringify(
      safeDetails
    )}`
  );
};
