import type { Request, Response, NextFunction } from "express";

/**
 * Middleware that automatically sets created_by / updated_by fields
 * from the authenticated user on POST, PUT, PATCH, DELETE requests.
 *
 * Must be used AFTER authMiddleware.
 *
 * For POST requests: sets created_by and updated_by to current userId.
 * For PUT/PATCH requests: sets updated_by to current userId.
 */
export function auditMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const userId = req.userId;

  if (!userId) {
    next();
    return;
  }

  const method = req.method.toUpperCase();

  if (method === "POST") {
    // For creates, set both created_by and updated_by
    if (req.body && typeof req.body === "object" && !Array.isArray(req.body)) {
      req.body.created_by = userId;
      req.body.updated_by = userId;
    }
  } else if (method === "PUT" || method === "PATCH") {
    // For updates, set updated_by (don't override created_by if present)
    if (req.body && typeof req.body === "object" && !Array.isArray(req.body)) {
      req.body.updated_by = userId;
    }
  }

  // For DELETE, we don't modify the body — the record is being removed

  next();
}
