import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const originalEnv = { ...process.env };

beforeEach(() => {
  // Restore clean env before each test and reset module cache
  process.env = { ...originalEnv };
  vi.resetModules();
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("createApp validation", () => {
  it("throws when JWT_SECRET is missing", async () => {
    delete process.env.JWT_SECRET;
    const { createApp } = await import("../app.js");
    expect(() => createApp()).toThrow("JWT_SECRET environment variable is required");
  });

  it("throws when JWT_SECRET is empty", async () => {
    process.env.JWT_SECRET = "";
    const { createApp } = await import("../app.js");
    expect(() => createApp()).toThrow("JWT_SECRET environment variable is required");
  });

  it("throws when CORS_ORIGIN is missing", async () => {
    process.env.JWT_SECRET = "test-secret";
    delete process.env.CORS_ORIGIN;
    const { createApp } = await import("../app.js");
    expect(() => createApp()).toThrow("CORS_ORIGIN environment variable is required");
  });

  it("does not throw when all required env vars are set", async () => {
    process.env.JWT_SECRET = "test-secret";
    process.env.CORS_ORIGIN = "http://localhost:5173";
    const { createApp } = await import("../app.js");
    expect(() => createApp()).not.toThrow();
  });
});
