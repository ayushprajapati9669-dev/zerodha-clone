/**
 * Admin Authorization Middleware
 * Enforces server-side role check ensuring only authenticated users
 * with role === "admin" can access administrative endpoints.
 */

export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required.",
    });
  }
  next();
};

export default adminOnly;
