import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../db/connection.js";

const BCRYPT_ROUNDS = 10;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return secret;
}

export async function register(
  email: string,
  password: string,
  role: string = "operator"
): Promise<{ id: number; email: string; role: string }> {
  const existing = await db("users").where({ email }).first();

  if (existing) {
    throw Object.assign(new Error("Email already registered"), {
      status: 409,
    });
  }

  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const [id] = await db("users").insert({ email, password_hash, role });

  return { id, email, role };
}

export async function login(
  email: string,
  password: string
): Promise<{ token: string; user: { id: number; email: string; role: string } }> {
  const user = await db("users").where({ email }).first();

  if (!user) {
    throw Object.assign(new Error("Invalid credentials"), { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    throw Object.assign(new Error("Invalid credentials"), { status: 401 });
  }

  const userRole = user.role ?? "operator";

  const token = jwt.sign(
    { id: user.id, email: user.email, role: userRole },
    getJwtSecret(),
    { expiresIn: "7d" }
  );

  return {
    token,
    user: { id: user.id, email: user.email, role: userRole },
  };
}
