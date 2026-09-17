export const roleMiddleware = (requiredRole) => {
  return (req, res, next) => {
    if (req.user.role !== requiredRole) {
      return res.status(403).json({
        success: false,
        data: null,
        message: "Forbidden",
      });
    }

    next();
  };
};