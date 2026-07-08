import { Router, type Request, type Response } from "express";
import { z } from "zod";
import * as authService from "../services/auth.js";

const router = Router();

const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

router.post("/register", async (req: Request, res: Response): Promise<void> => {
  const result = registerSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      error: result.error.issues[0]?.message ?? "Validation failed",
    });
    return;
  }

  try {
    const user = await authService.register(
      result.data.email,
      result.data.password
    );
    res.status(201).json(user);
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    if (error.status === 409) {
      res.status(409).json({ error: error.message });
      return;
    }
    console.error("Register error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req: Request, res: Response): Promise<void> => {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      error: result.error.issues[0]?.message ?? "Validation failed",
    });
    return;
  }

  try {
    const data = await authService.login(
      result.data.email,
      result.data.password
    );
    res.json(data);
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    if (error.status === 401) {
      res.status(401).json({ error: error.message });
      return;
    }
    console.error("Login error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
