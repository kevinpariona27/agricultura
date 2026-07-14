import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Express Request to include userId and user info
declare global {
  namespace Express {
    interface Request {
      userId?: number;
      user?: JwtUserPayload;
    }
  }
}

export interface JwtUserPayload {
  id: number;
  email: string;
  role: string;
}

interface JwtPayload extends JwtUserPayload {
  iat?: number;
  exp?: number;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return secret;
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const token = header.slice(7); // Remove "Bearer "

  try {
    const payload = jwt.verify(token, getJwtSecret()) as JwtPayload;
    req.userId = payload.id;
    req.user = { id: payload.id, email: payload.email, role: payload.role ?? "operator" };
    next();
  } catch (err: unknown) {
    const error = err as Error;
    if (error.name === "TokenExpiredError") {
      res.status(401).json({ error: "Token expired" });
      return;
    }
    res.status(401).json({ error: "Authentication required" });
  }
}
