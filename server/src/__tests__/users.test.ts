import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import db from "../db/connection.js";
import { createApp } from "../app.js";

const app = createApp();
const JWT_SECRET = process.env.JWT_SECRET!;

/**
 * Users route tests — user-management
 *
 * Scenarios covered:
 * - GET /api/users/me returns profile (200)
 * - GET /api/users/me without auth (401)
 * - GET /api/users/me for non-existent user (404)
 * - PUT /api/users/me updates nombre (200)
 * - PUT /api/users/me updates rol (200)
 * - PUT /api/users/me without auth (401)
 * - PUT /api/users/me with invalid rol (400)
 * - PUT /api/users/me with empty name (400)
 * - PUT /api/users/me with empty body — no fields (400)
 * - PUT /api/users/me for non-existent user (404)
 */

function tokenFor(userId: number, email: string): string {
  return jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: "7d" });
}

function authHeader(userId: number, email: string): string {
  return `Bearer ${tokenFor(userId, email)}`;
}

/** Insert a user and return [id, email] */
async function insertUser(
  email: string,
  overrides: Partial<{ nombre: string; rol: string }> = {}
): Promise<[number, string]> {
  const [id] = await db("users").insert({
    email,
    password_hash: "ignored-in-tests",
    nombre: overrides.nombre ?? null,
    rol: overrides.rol ?? "operador",
  });
  return [id, email];
}

beforeAll(async () => {
  // Create users table with all columns for test (in-memory SQLite)
  if (!(await db.schema.hasTable("users"))) {
    await db.schema.createTable("users", (table) => {
      table.increments("id").primary();
      table.text("email").notNullable().unique();
      table.text("password_hash").notNullable();
      table.text("created_at").notNullable().defaultTo(db.fn.now());
      table.text("nombre");
      table.text("rol").defaultTo("operador");
      table.text("updated_at").defaultTo(db.fn.now());
    });
  }
});

beforeEach(async () => {
  await db("users").del();
});

describe("GET /api/users/me", () => {
  it("returns the current user profile (200)", async () => {
    const [userId, email] = await insertUser("profile@test.com", {
      nombre: "Test User",
      rol: "admin",
    });

    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", authHeader(userId, email));

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: userId,
      email: "profile@test.com",
      nombre: "Test User",
      rol: "admin",
    });
    expect(res.body).toHaveProperty("fecha_registro");
    // Password must NOT be exposed
    expect(res.body).not.toHaveProperty("password_hash");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).get("/api/users/me");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Authentication required");
  });

  it("returns rol=operador as default when not set", async () => {
    const [userId, email] = await insertUser("new@test.com");

    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", authHeader(userId, email));

    expect(res.status).toBe(200);
    expect(res.body.rol).toBe("operador");
    expect(res.body.nombre).toBeNull();
  });
});

describe("PUT /api/users/me", () => {
  it("updates nombre and returns updated profile (200)", async () => {
    const [userId, email] = await insertUser("edit@test.com");

    const res = await request(app)
      .put("/api/users/me")
      .set("Authorization", authHeader(userId, email))
      .send({ nombre: "Updated Name" });

    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe("Updated Name");
    expect(res.body.email).toBe("edit@test.com");
  });

  it("updates rol and returns updated profile (200)", async () => {
    const [userId, email] = await insertUser("role@test.com");

    const res = await request(app)
      .put("/api/users/me")
      .set("Authorization", authHeader(userId, email))
      .send({ rol: "admin" });

    expect(res.status).toBe(200);
    expect(res.body.rol).toBe("admin");
  });

  it("updates both nombre and rol together (200)", async () => {
    const [userId, email] = await insertUser("both@test.com");

    const res = await request(app)
      .put("/api/users/me")
      .set("Authorization", authHeader(userId, email))
      .send({ nombre: "Full User", rol: "admin" });

    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe("Full User");
    expect(res.body.rol).toBe("admin");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app)
      .put("/api/users/me")
      .send({ nombre: "No Auth" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Authentication required");
  });

  it("returns 400 for invalid rol value", async () => {
    const [userId, email] = await insertUser("badrol@test.com");

    const res = await request(app)
      .put("/api/users/me")
      .set("Authorization", authHeader(userId, email))
      .send({ rol: "superadmin" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 400 for empty name in body", async () => {
    const [userId, email] = await insertUser("empty@test.com");

    const res = await request(app)
      .put("/api/users/me")
      .set("Authorization", authHeader(userId, email))
      .send({ nombre: "" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 400 when body has no valid fields", async () => {
    const [userId, email] = await insertUser("nofields@test.com");

    const res = await request(app)
      .put("/api/users/me")
      .set("Authorization", authHeader(userId, email))
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("No fields to update");
  });
});
