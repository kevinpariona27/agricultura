import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import db from "../db/connection.js";
import { createApp } from "../app.js";

const app = createApp();

/**
 * Auth route tests (Task 8.1)
 *
 * Scenarios covered:
 * - register success (201)
 * - register duplicate email (409)
 * - register weak password (400)
 * - login success (200)
 * - login invalid credentials (401)
 */

beforeAll(async () => {
  // Create tables for test (in-memory SQLite)
  if (!(await db.schema.hasTable("users"))) {
    await db.schema.createTable("users", (table) => {
      table.increments("id").primary();
      table.text("email").notNullable().unique();
      table.text("password_hash").notNullable();
      table.text("created_at").notNullable().defaultTo(db.fn.now());
    });
  }
});

beforeEach(async () => {
  await db("users").del();
});

describe("POST /api/auth/register", () => {
  it("registers a new user and returns 201 with id and email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "test@farm.com", password: "secret123" });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.email).toBe("test@farm.com");
    // Password must NOT be exposed
    expect(res.body).not.toHaveProperty("password");
    expect(res.body).not.toHaveProperty("password_hash");
  });

  it("returns 409 for duplicate email", async () => {
    // First registration
    await request(app)
      .post("/api/auth/register")
      .send({ email: "test@farm.com", password: "secret123" });

    // Duplicate attempt
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "test@farm.com", password: "secret123" });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("Email already registered");
  });

  it("returns 400 for weak password (less than 8 chars)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "test@farm.com", password: "1234567" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 400 for invalid email format", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "not-an-email", password: "secret123" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});

describe("POST /api/auth/login", () => {
  const email = "user@test.com";
  const password = "secret123";

  beforeEach(async () => {
    // Register a user first
    await request(app)
      .post("/api/auth/register")
      .send({ email, password });
  });

  it("logs in with valid credentials and returns token + user", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(typeof res.body.token).toBe("string");
    expect(res.body.user).toEqual({ id: expect.any(Number), email });
  });

  it("returns 401 for invalid password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "wrongpassword" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });

  it("returns 401 for non-existent email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "noone@test.com", password: "secret123" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });

  it("returns 400 for missing email in body", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ password: "secret123" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});
