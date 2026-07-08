import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import db from "../db/connection.js";
import { createApp } from "../app.js";

const app = createApp();
const JWT_SECRET = process.env.JWT_SECRET!;

/**
 * Irrigation routes tests (Change — irrigation-management)
 *
 * Scenarios covered:
 * - Auth guard (401)
 * - List all user irrigations + crop_id/method/date_from/date_to filters
 * - Get single irrigation by id (own, cross-user 404, invalid id 400)
 * - Create with validation (amount>0, method enum, date format) + crop ownership check
 * - Update partial (success, cross-user 404, crop_id re-verification, no fields 400)
 * - Delete (204, cross-user 404, non-existent 404)
 * - Cross-user data isolation through two-JOIN scoping
 */

function tokenFor(userId: number, email: string): string {
  return jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: "7d" });
}

function authHeader(userId: number, email: string): string {
  return `Bearer ${tokenFor(userId, email)}`;
}

/** Insert a user and return [id, email] */
async function insertUser(email: string): Promise<[number, string]> {
  const [id] = await db("users").insert({
    email,
    password_hash: "ignored-in-tests",
  });
  return [id, email];
}

/** Insert a parcel for a given userId */
async function insertParcel(
  userId: number,
  overrides: Partial<{
    name: string;
    area: number;
    location: string;
    soil_type: string;
  }> = {}
): Promise<number> {
  const [id] = await db("parcels").insert({
    user_id: userId,
    name: overrides.name ?? "Test Parcel",
    area: overrides.area ?? 10,
    location: overrides.location ?? "Test Location",
    soil_type: overrides.soil_type ?? "arcilloso",
  });
  return id;
}

/** Insert a crop for a given parcel_id */
async function insertCrop(
  parcelId: number,
  overrides: Partial<{
    variety: string;
    planting_date: string;
    status: string;
    estimated_harvest_date: string;
    planting_density: number;
    notes: string;
  }> = {}
): Promise<number> {
  const [id] = await db("crops").insert({
    parcel_id: parcelId,
    variety: overrides.variety ?? "Maíz",
    planting_date: overrides.planting_date ?? "2026-03-15",
    status: overrides.status ?? "en_crecimiento",
    estimated_harvest_date: overrides.estimated_harvest_date ?? null,
    planting_density: overrides.planting_density ?? null,
    notes: overrides.notes ?? null,
  });
  return id;
}

/** Insert an irrigation for a given crop_id */
async function insertIrrigation(
  cropId: number,
  overrides: Partial<{
    amount: number;
    irrigation_date: string;
    method: string;
    duration: number;
    notes: string;
  }> = {}
): Promise<number> {
  const [id] = await db("irrigations").insert({
    crop_id: cropId,
    amount: overrides.amount ?? 30,
    irrigation_date: overrides.irrigation_date ?? "2026-06-15",
    method: overrides.method ?? "goteo",
    duration: overrides.duration ?? null,
    notes: overrides.notes ?? null,
  });
  return id;
}

beforeAll(async () => {
  // Create tables manually for in-memory SQLite test environment
  if (!(await db.schema.hasTable("users"))) {
    await db.schema.createTable("users", (table) => {
      table.increments("id").primary();
      table.text("email").notNullable().unique();
      table.text("password_hash").notNullable();
      table.text("created_at").notNullable().defaultTo(db.fn.now());
    });
  }
  if (!(await db.schema.hasTable("parcels"))) {
    await db.schema.createTable("parcels", (table) => {
      table.increments("id").primary();
      table
        .integer("user_id")
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table.text("name").notNullable();
      table.float("area").notNullable();
      table.text("location").notNullable();
      table.text("soil_type").notNullable();
      table.text("created_at").notNullable().defaultTo(db.fn.now());
      table.text("updated_at").notNullable().defaultTo(db.fn.now());
    });
  }
  if (!(await db.schema.hasTable("crops"))) {
    await db.schema.createTable("crops", (table) => {
      table.increments("id").primary();
      table
        .integer("parcel_id")
        .notNullable()
        .references("id")
        .inTable("parcels")
        .onDelete("CASCADE");
      table.text("variety").notNullable();
      table.text("planting_date").notNullable();
      table.text("status").notNullable();
      table.text("estimated_harvest_date");
      table.float("planting_density");
      table.text("notes");
      table.text("created_at").notNullable().defaultTo(db.fn.now());
      table.text("updated_at").notNullable().defaultTo(db.fn.now());
    });
  }
  if (!(await db.schema.hasTable("irrigations"))) {
    await db.schema.createTable("irrigations", (table) => {
      table.increments("id").primary();
      table
        .integer("crop_id")
        .notNullable()
        .references("id")
        .inTable("crops")
        .onDelete("CASCADE");
      table.float("amount").notNullable();
      table.text("irrigation_date").notNullable();
      table.text("method").notNullable();
      table.float("duration");
      table.text("notes");
      table.text("created_at").notNullable().defaultTo(db.fn.now());
      table.text("updated_at").notNullable().defaultTo(db.fn.now());
    });
  }
});

beforeEach(async () => {
  // Clean up in reverse FK order
  await db("irrigations").del();
  await db("crops").del();
  await db("parcels").del();
  await db("users").del();
});

// ── Auth guard ──────────────────────────────────────────────────────────

describe("Authentication guard", () => {
  it("returns 401 when no Authorization header is present", async () => {
    const res = await request(app).get("/api/irrigations");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Authentication required");
  });

  it("returns 401 when token is missing Bearer prefix", async () => {
    const tok = jwt.sign({ id: 1, email: "x@t.com" }, JWT_SECRET);
    const res = await request(app)
      .get("/api/irrigations")
      .set("Authorization", tok);
    expect(res.status).toBe(401);
  });

  it("returns 401 with an expired token", async () => {
    const expiredToken = jwt.sign(
      { id: 1, email: "u@test.com" },
      JWT_SECRET,
      { expiresIn: "0s" }
    );
    const res = await request(app)
      .get("/api/irrigations")
      .set("Authorization", `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });
});

// ── List irrigations ─────────────────────────────────────────────────────

describe("GET /api/irrigations — list", () => {
  let userId: number;
  let userEmail: string;
  let parcelId: number;
  let cropId: number;

  beforeEach(async () => {
    [userId, userEmail] = await insertUser("u1@test.com");
    parcelId = await insertParcel(userId, { name: "Lote Norte" });
    cropId = await insertCrop(parcelId, { variety: "Maíz" });
  });

  it("returns empty array when user has no irrigations", async () => {
    const res = await request(app)
      .get("/api/irrigations")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns all irrigations for the authenticated user", async () => {
    await insertIrrigation(cropId, { amount: 30, method: "goteo" });
    await insertIrrigation(cropId, { amount: 50, method: "aspersion" });

    const res = await request(app)
      .get("/api/irrigations")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toHaveProperty("amount");
    expect(res.body[0]).toHaveProperty("method");
    expect(res.body[0]).toHaveProperty("irrigation_date");
  });

  it("only returns irrigations scoped to the authenticated user (two-JOIN isolation)", async () => {
    const [user2Id, user2Email] = await insertUser("u2@test.com");
    const parcel2Id = await insertParcel(user2Id, { name: "Lote Sur" });
    const crop2Id = await insertCrop(parcel2Id, { variety: "Trigo" });

    await insertIrrigation(cropId, {
      amount: 30,
      method: "goteo",
      notes: "user1-irrigation",
    });
    await insertIrrigation(crop2Id, {
      amount: 50,
      method: "aspersion",
      notes: "user2-irrigation",
    });

    const res = await request(app)
      .get("/api/irrigations")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].notes).toBe("user1-irrigation");
  });

  it("filters by crop_id query param", async () => {
    const crop2Id = await insertCrop(parcelId, { variety: "Trigo" });
    await insertIrrigation(cropId, { amount: 30, method: "goteo" });
    await insertIrrigation(crop2Id, { amount: 50, method: "aspersion" });

    const res = await request(app)
      .get(`/api/irrigations?crop_id=${crop2Id}`)
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].amount).toBe(50);
  });

  it("filters by method query param", async () => {
    await insertIrrigation(cropId, { amount: 30, method: "goteo" });
    await insertIrrigation(cropId, { amount: 50, method: "aspersion" });
    await insertIrrigation(cropId, { amount: 70, method: "manual" });

    const res = await request(app)
      .get("/api/irrigations?method=aspersion")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].method).toBe("aspersion");
  });

  it("filters by date_from (>=)", async () => {
    await insertIrrigation(cropId, {
      amount: 30,
      irrigation_date: "2026-01-15",
      method: "goteo",
    });
    await insertIrrigation(cropId, {
      amount: 50,
      irrigation_date: "2026-03-20",
      method: "aspersion",
    });
    await insertIrrigation(cropId, {
      amount: 70,
      irrigation_date: "2026-06-10",
      method: "manual",
    });

    const res = await request(app)
      .get("/api/irrigations?date_from=2026-03-01")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    // Both Mar 20 and Jun 10 should be included, but NOT Jan 15
    const dates = res.body.map((i: { irrigation_date: string }) => i.irrigation_date);
    expect(dates).toContain("2026-03-20");
    expect(dates).toContain("2026-06-10");
  });

  it("filters by date_to (<=)", async () => {
    await insertIrrigation(cropId, {
      amount: 30,
      irrigation_date: "2026-01-15",
      method: "goteo",
    });
    await insertIrrigation(cropId, {
      amount: 50,
      irrigation_date: "2026-06-10",
      method: "aspersion",
    });

    const res = await request(app)
      .get("/api/irrigations?date_to=2026-05-01")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].irrigation_date).toBe("2026-01-15");
  });

  it("filters by date_from and date_to combined", async () => {
    await insertIrrigation(cropId, {
      amount: 30,
      irrigation_date: "2026-01-15",
      method: "goteo",
    });
    await insertIrrigation(cropId, {
      amount: 50,
      irrigation_date: "2026-03-20",
      method: "aspersion",
    });
    await insertIrrigation(cropId, {
      amount: 70,
      irrigation_date: "2026-06-10",
      method: "manual",
    });

    const res = await request(app)
      .get("/api/irrigations?date_from=2026-02-01&date_to=2026-05-01")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].irrigation_date).toBe("2026-03-20");
  });

  it("combines crop_id, method, and date filters", async () => {
    const crop2Id = await insertCrop(parcelId, { variety: "Trigo" });
    await insertIrrigation(cropId, { amount: 30, method: "goteo", irrigation_date: "2026-03-20" });
    await insertIrrigation(cropId, { amount: 50, method: "aspersion", irrigation_date: "2026-03-20" });
    await insertIrrigation(crop2Id, { amount: 70, method: "goteo", irrigation_date: "2026-03-20" });

    const res = await request(app)
      .get(`/api/irrigations?crop_id=${cropId}&method=goteo&date_from=2026-01-01&date_to=2026-12-31`)
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].amount).toBe(30);
  });
});

// ── Get single irrigation ────────────────────────────────────────────────

describe("GET /api/irrigations/:id — get by id", () => {
  let userId: number;
  let userEmail: string;
  let user2Id: number;
  let user2Email: string;
  let parcelId: number;
  let cropId: number;
  let irrigationId: number;

  beforeEach(async () => {
    [userId, userEmail] = await insertUser("u1@test.com");
    [user2Id, user2Email] = await insertUser("u2@test.com");
    parcelId = await insertParcel(userId, { name: "Lote Norte" });
    cropId = await insertCrop(parcelId, { variety: "Maíz" });
    irrigationId = await insertIrrigation(cropId, {
      amount: 45.5,
      irrigation_date: "2026-06-10",
      method: "goteo",
      duration: 120,
      notes: "Riego profundo",
    });
  });

  it("returns the irrigation for the owning user", async () => {
    const res = await request(app)
      .get(`/api/irrigations/${irrigationId}`)
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body.amount).toBe(45.5);
    expect(res.body.irrigation_date).toBe("2026-06-10");
    expect(res.body.method).toBe("goteo");
    expect(res.body.duration).toBe(120);
    expect(res.body.notes).toBe("Riego profundo");
    expect(res.body.crop_id).toBe(cropId);
    expect(res.body).toHaveProperty("created_at");
    expect(res.body).toHaveProperty("updated_at");
  });

  it("returns 404 when another user tries to access", async () => {
    const res = await request(app)
      .get(`/api/irrigations/${irrigationId}`)
      .set("Authorization", authHeader(user2Id, user2Email));

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Irrigation not found");
  });

  it("returns 404 for non-existent irrigation id", async () => {
    const res = await request(app)
      .get("/api/irrigations/99999")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid irrigation id", async () => {
    const res = await request(app)
      .get("/api/irrigations/notanumber")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid irrigation ID");
  });
});

// ── Create irrigation ────────────────────────────────────────────────────

describe("POST /api/irrigations — create", () => {
  let userId: number;
  let userEmail: string;
  let user2Id: number;
  let user2Email: string;
  let parcelId: number;
  let cropId: number;

  beforeEach(async () => {
    [userId, userEmail] = await insertUser("u1@test.com");
    [user2Id, user2Email] = await insertUser("u2@test.com");
    parcelId = await insertParcel(userId, { name: "Lote Norte" });
    cropId = await insertCrop(parcelId, { variety: "Maíz" });
  });

  const validIrrigation = {
    crop_id: 0, // replaced in each test
    amount: 25.5,
    irrigation_date: "2026-06-10",
    method: "goteo",
  };

  it("creates an irrigation and returns 201", async () => {
    const res = await request(app)
      .post("/api/irrigations")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ ...validIrrigation, crop_id: cropId });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.amount).toBe(25.5);
    expect(res.body.crop_id).toBe(cropId);
    expect(res.body.irrigation_date).toBe("2026-06-10");
    expect(res.body.method).toBe("goteo");
    expect(res.body).toHaveProperty("created_at");
    expect(res.body).toHaveProperty("updated_at");
  });

  it("creates an irrigation with optional fields", async () => {
    const res = await request(app)
      .post("/api/irrigations")
      .set("Authorization", authHeader(userId, userEmail))
      .send({
        crop_id: cropId,
        amount: 40,
        irrigation_date: "2026-07-01",
        method: "aspersion",
        duration: 90,
        notes: "Riego por calor extremo",
      });

    expect(res.status).toBe(201);
    expect(res.body.duration).toBe(90);
    expect(res.body.notes).toBe("Riego por calor extremo");
  });

  it("returns 400 when amount is not positive (amount=0)", async () => {
    const res = await request(app)
      .post("/api/irrigations")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ ...validIrrigation, crop_id: cropId, amount: 0 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Amount must be greater than 0");
  });

  it("returns 400 when amount is negative", async () => {
    const res = await request(app)
      .post("/api/irrigations")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ ...validIrrigation, crop_id: cropId, amount: -5 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Amount must be greater than 0");
  });

  it("returns 400 when method is invalid", async () => {
    const res = await request(app)
      .post("/api/irrigations")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ ...validIrrigation, crop_id: cropId, method: "lluvia" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 400 when irrigation_date format is invalid", async () => {
    const res = await request(app)
      .post("/api/irrigations")
      .set("Authorization", authHeader(userId, userEmail))
      .send({
        ...validIrrigation,
        crop_id: cropId,
        irrigation_date: "10-06-2026",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid date format");
  });

  it("returns 400 when crop_id is missing", async () => {
    const res = await request(app)
      .post("/api/irrigations")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ amount: 30, irrigation_date: "2026-06-10", method: "goteo" });

    expect(res.status).toBe(400);
  });

  it("returns 404 when crop does not belong to user (cross-user crop)", async () => {
    const user2ParcelId = await insertParcel(user2Id, { name: "User2 Parcel" });
    const user2CropId = await insertCrop(user2ParcelId, { variety: "User2 Crop" });

    const res = await request(app)
      .post("/api/irrigations")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ ...validIrrigation, crop_id: user2CropId });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Crop not found");
  });

  it("returns 401 when no auth token provided", async () => {
    const res = await request(app)
      .post("/api/irrigations")
      .send({ ...validIrrigation, crop_id: cropId });

    expect(res.status).toBe(401);
  });
});

// ── Update irrigation ────────────────────────────────────────────────────

describe("PUT /api/irrigations/:id — update", () => {
  let userId: number;
  let userEmail: string;
  let user2Id: number;
  let user2Email: string;
  let parcelId: number;
  let cropId: number;
  let irrigationId: number;

  beforeEach(async () => {
    [userId, userEmail] = await insertUser("u1@test.com");
    [user2Id, user2Email] = await insertUser("u2@test.com");
    parcelId = await insertParcel(userId, { name: "Lote Norte" });
    cropId = await insertCrop(parcelId, { variety: "Maíz" });
    irrigationId = await insertIrrigation(cropId, {
      amount: 30,
      irrigation_date: "2026-06-10",
      method: "goteo",
      notes: "Original",
    });
  });

  it("updates the irrigation and returns 200", async () => {
    const res = await request(app)
      .put(`/api/irrigations/${irrigationId}`)
      .set("Authorization", authHeader(userId, userEmail))
      .send({ amount: 45, method: "aspersion" });

    expect(res.status).toBe(200);
    expect(res.body.amount).toBe(45);
    expect(res.body.method).toBe("aspersion");
    expect(res.body.notes).toBe("Original"); // untouched
    expect(res.body.irrigation_date).toBe("2026-06-10"); // untouched
  });

  it("returns 200 when updating with optional fields", async () => {
    const res = await request(app)
      .put(`/api/irrigations/${irrigationId}`)
      .set("Authorization", authHeader(userId, userEmail))
      .send({ duration: 60, notes: "Updated notes" });

    expect(res.status).toBe(200);
    expect(res.body.duration).toBe(60);
    expect(res.body.notes).toBe("Updated notes");
  });

  it("returns 404 when another user tries to update", async () => {
    const res = await request(app)
      .put(`/api/irrigations/${irrigationId}`)
      .set("Authorization", authHeader(user2Id, user2Email))
      .send({ amount: 999 });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Irrigation not found");
  });

  it("returns 404 when crop_id is changed to an unowned crop", async () => {
    const user2ParcelId = await insertParcel(user2Id, { name: "User2 Parcel" });
    const user2CropId = await insertCrop(user2ParcelId, { variety: "User2 Crop" });

    const res = await request(app)
      .put(`/api/irrigations/${irrigationId}`)
      .set("Authorization", authHeader(userId, userEmail))
      .send({ crop_id: user2CropId });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Irrigation not found");
  });

  it("returns 200 when crop_id changes to another owned crop", async () => {
    const crop2Id = await insertCrop(parcelId, { variety: "Trigo" });

    const res = await request(app)
      .put(`/api/irrigations/${irrigationId}`)
      .set("Authorization", authHeader(userId, userEmail))
      .send({ crop_id: crop2Id });

    expect(res.status).toBe(200);
    expect(res.body.crop_id).toBe(crop2Id);
  });

  it("returns 400 when no fields provided", async () => {
    const res = await request(app)
      .put(`/api/irrigations/${irrigationId}`)
      .set("Authorization", authHeader(userId, userEmail))
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("No fields to update");
  });

  it("returns 404 for non-existent irrigation id", async () => {
    const res = await request(app)
      .put("/api/irrigations/99999")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ amount: 10 });

    expect(res.status).toBe(404);
  });
});

// ── Delete irrigation ────────────────────────────────────────────────────

describe("DELETE /api/irrigations/:id — delete", () => {
  let userId: number;
  let userEmail: string;
  let user2Id: number;
  let user2Email: string;
  let parcelId: number;
  let cropId: number;
  let irrigationId: number;

  beforeEach(async () => {
    [userId, userEmail] = await insertUser("u1@test.com");
    [user2Id, user2Email] = await insertUser("u2@test.com");
    parcelId = await insertParcel(userId, { name: "Lote Norte" });
    cropId = await insertCrop(parcelId, { variety: "Maíz" });
    irrigationId = await insertIrrigation(cropId, {
      amount: 30,
      irrigation_date: "2026-06-10",
      method: "goteo",
    });
  });

  it("deletes the irrigation and returns 204", async () => {
    const res = await request(app)
      .delete(`/api/irrigations/${irrigationId}`)
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(204);

    // Verify it's gone
    const getRes = await request(app)
      .get(`/api/irrigations/${irrigationId}`)
      .set("Authorization", authHeader(userId, userEmail));
    expect(getRes.status).toBe(404);
  });

  it("returns 404 when another user tries to delete", async () => {
    const res = await request(app)
      .delete(`/api/irrigations/${irrigationId}`)
      .set("Authorization", authHeader(user2Id, user2Email));

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Irrigation not found");
  });

  it("returns 404 for non-existent id", async () => {
    const res = await request(app)
      .delete("/api/irrigations/99999")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(404);
  });
});
