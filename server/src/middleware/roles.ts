import type { Request, Response, NextFunction } from "express";

/**
 * Middleware that restricts access to routes based on user role.
 * Must be used AFTER authMiddleware which sets req.user.
 *
 * @param roles - List of roles allowed to access the route
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    next();
  };
}
