import { describe, it, expect, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { errorHandler } from "../middleware/error.js";

const JWT_SECRET = process.env.JWT_SECRET!;

/**
 * Middleware tests (Task 8.3)
 *
 * - authMiddleware: valid/missing/invalid/expired tokens
 * - errorHandler: JSON shape { error: "..." }
 */

// ── Auth middleware (unit-level via mocked req/res) ────────────────────

describe("authMiddleware", () => {
  function mockReqRes(headers: Record<string, string> = {}) {
    const req = {
      headers,
      userId: undefined as number | undefined,
    } as unknown as Request;

    let statusCode = 200;
    let body: unknown = null;

    const res = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: unknown) {
        body = data;
        return this;
      },
    } as unknown as Response;

    const getStatus = () => statusCode;
    const getBody = () => body;

    return { req, res, getStatus, getBody };
  }

  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  it("calls next() when token is valid", () => {
    const token = jwt.sign({ id: 42, email: "u@test.com" }, JWT_SECRET);
    const { req, res, getStatus, getBody } = mockReqRes({
      authorization: `Bearer ${token}`,
    });
    let called = false;
    const nextSpy: NextFunction = () => {
      called = true;
    };

    authMiddleware(req, res, nextSpy);

    expect(called).toBe(true);
    expect(req.userId).toBe(42);
    expect(getStatus()).toBe(200); // not changed
    expect(getBody()).toBeNull();
  });

  it("returns 401 when Authorization header is missing", () => {
    const { req, res, getStatus, getBody } = mockReqRes();

    authMiddleware(req, res, (() => {}) as NextFunction);

    expect(getStatus()).toBe(401);
    expect(getBody()).toEqual({ error: "Authentication required" });
  });

  it("returns 401 when Authorization header lacks Bearer prefix", () => {
    const token = jwt.sign({ id: 1, email: "u@test.com" }, JWT_SECRET);
    const { req, res, getStatus, getBody } = mockReqRes({
      authorization: token, // No "Bearer "
    });

    authMiddleware(req, res, (() => {}) as NextFunction);

    expect(getStatus()).toBe(401);
    expect(getBody()).toEqual({ error: "Authentication required" });
  });

  it("returns 401 when token is expired", () => {
    const expiredToken = jwt.sign(
      { id: 1, email: "u@test.com" },
      JWT_SECRET,
      { expiresIn: "0s" }
    );
    const { req, res, getStatus, getBody } = mockReqRes({
      authorization: `Bearer ${expiredToken}`,
    });

    authMiddleware(req, res, (() => {}) as NextFunction);

    expect(getStatus()).toBe(401);
    expect(getBody()).toEqual({ error: "Token expired" });
  });

  it("returns 401 when token is mangled/not a real JWT", () => {
    const { req, res, getStatus, getBody } = mockReqRes({
      authorization: "Bearer not.a.valid.token",
    });

    authMiddleware(req, res, (() => {}) as NextFunction);

    expect(getStatus()).toBe(401);
    expect(getBody()).toEqual({ error: "Authentication required" });
  });
});

// ── Error handler (integration via Express app) ────────────────────────

describe("errorHandler", () => {
  it("returns 500 with JSON error shape for unhandled errors", async () => {
    const app = express();
    app.use(express.json());

    // Route that throws
    app.get("/api/broken", (_req, _res) => {
      throw new Error("Something went wrong");
    });

    app.use(errorHandler);

    const res = await request(app).get("/api/broken");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
  });

  it("returns JSON error shape for 404 not found", async () => {
    const app = express();
    app.use(express.json());

    app.use((_req, res) => {
      res.status(404).json({ error: "Not found" });
    });

    app.use(errorHandler);

    const res = await request(app).get("/api/nonexistent");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Not found" });
  });
});
