import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import * as usersService from "../services/users.js";

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

const updateProfileSchema = z.object({
  nombre: z.string().min(1, "Name cannot be empty").optional(),
  role: z.enum(["admin", "manager", "operator"]).optional(),
});

// GET /api/users/me — get current user profile
router.get("/me", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const profile = await usersService.getProfile(userId);

    if (!profile) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(profile);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Get profile error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/users/me — update own name and/or role
router.put("/me", async (req: Request, res: Response): Promise<void> => {
  const result = updateProfileSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      error: result.error.issues[0]?.message ?? "Validation failed",
    });
    return;
  }

  if (Object.keys(result.data).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  try {
    const userId = req.userId!;
    const profile = await usersService.updateProfile(userId, result.data);

    if (!profile) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(profile);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Update profile error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
