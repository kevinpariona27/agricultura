import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import db from "../db/connection.js";
import { createApp } from "../app.js";

const app = createApp();
const JWT_SECRET = process.env.JWT_SECRET!;

/**
 * Crops route tests (Change #2 — crop-management)
 *
 * Scenarios covered:
 * - List all user crops + parcel_id/status/search filters
 * - Get single crop by id
 * - Create with validation + parcel ownership check
 * - Update with partial fields + cross-user 404
 * - Delete with cross-user 404
 * - Auth guard (401)
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
});

beforeEach(async () => {
  // Clean up in reverse FK order
  await db("crops").del();
  await db("parcels").del();
  await db("users").del();
});

// ── Auth guard ──────────────────────────────────────────────────────────

describe("Authentication guard", () => {
  it("returns 401 when no Authorization header is present", async () => {
    const res = await request(app).get("/api/crops");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Authentication required");
  });

  it("returns 401 when token is missing Bearer prefix", async () => {
    const tok = jwt.sign({ id: 1, email: "x@t.com" }, JWT_SECRET);
    const res = await request(app)
      .get("/api/crops")
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
      .get("/api/crops")
      .set("Authorization", `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });
});

// ── List crops ──────────────────────────────────────────────────────────

describe("GET /api/crops — list", () => {
  let userId: number;
  let userEmail: string;
  let parcelId: number;

  beforeEach(async () => {
    [userId, userEmail] = await insertUser("u1@test.com");
    parcelId = await insertParcel(userId, { name: "Lote Norte" });
  });

  it("returns empty array when user has no crops", async () => {
    const res = await request(app)
      .get("/api/crops")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns all crops for the authenticated user", async () => {
    await insertCrop(parcelId, { variety: "Maíz" });
    await insertCrop(parcelId, { variety: "Trigo" });

    const res = await request(app)
      .get("/api/crops")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it("only returns crops for the authenticated user (not others)", async () => {
    const [user2Id] = await insertUser("u2@test.com");
    const parcel2Id = await insertParcel(user2Id, { name: "Lote Sur" });

    await insertCrop(parcelId, { variety: "User1 Crop" });
    await insertCrop(parcel2Id, { variety: "User2 Crop" });

    const res = await request(app)
      .get("/api/crops")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].variety).toBe("User1 Crop");
  });

  it("filters by parcel_id query param", async () => {
    const parcel2Id = await insertParcel(userId, { name: "Lote 2" });
    await insertCrop(parcelId, { variety: "Maíz" });
    await insertCrop(parcel2Id, { variety: "Trigo" });

    const res = await request(app)
      .get(`/api/crops?parcel_id=${parcel2Id}`)
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].variety).toBe("Trigo");
  });

  it("filters by status query param", async () => {
    await insertCrop(parcelId, { variety: "Maíz", status: "planificado" });
    await insertCrop(parcelId, { variety: "Trigo", status: "en_cosecha" });

    const res = await request(app)
      .get("/api/crops?status=en_cosecha")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].status).toBe("en_cosecha");
  });

  it("filters by search query (case-insensitive on variety)", async () => {
    await insertCrop(parcelId, { variety: "Maíz" });
    await insertCrop(parcelId, { variety: "Trigo" });
    await insertCrop(parcelId, { variety: "Soja" });

    const res = await request(app)
      .get("/api/crops?search=ma")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].variety).toBe("Maíz");
  });

  it("combines multiple filters", async () => {
    const parcel2Id = await insertParcel(userId, { name: "Lote 2" });

    await insertCrop(parcelId, {
      variety: "Maíz",
      status: "planificado",
    });
    await insertCrop(parcelId, {
      variety: "Trigo",
      status: "en_crecimiento",
    });
    await insertCrop(parcel2Id, {
      variety: "Trigo",
      status: "en_crecimiento",
    });

    const res = await request(app)
      .get(`/api/crops?parcel_id=${parcelId}&status=en_crecimiento`)
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].variety).toBe("Trigo");
    expect(res.body[0].parcel_id).toBe(parcelId);
  });
});

// ── Get single crop ─────────────────────────────────────────────────────

describe("GET /api/crops/:id — get by id", () => {
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
    cropId = await insertCrop(parcelId, {
      variety: "Maíz",
      planting_date: "2026-03-15",
      status: "en_crecimiento",
    });
  });

  it("returns the crop for the owning user", async () => {
    const res = await request(app)
      .get(`/api/crops/${cropId}`)
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body.variety).toBe("Maíz");
    expect(res.body.parcel_id).toBe(parcelId);
    expect(res.body.status).toBe("en_crecimiento");
    expect(res.body).toHaveProperty("created_at");
    expect(res.body).toHaveProperty("updated_at");
  });

  it("returns 404 when another user tries to access", async () => {
    const res = await request(app)
      .get(`/api/crops/${cropId}`)
      .set("Authorization", authHeader(user2Id, user2Email));

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Crop not found");
  });

  it("returns 404 for non-existent crop id", async () => {
    const res = await request(app)
      .get("/api/crops/99999")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid crop id", async () => {
    const res = await request(app)
      .get("/api/crops/notanumber")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid crop ID");
  });
});

// ── Create crop ─────────────────────────────────────────────────────────

describe("POST /api/crops — create", () => {
  let userId: number;
  let userEmail: string;
  let user2Id: number;
  let user2Email: string;
  let parcelId: number;

  beforeEach(async () => {
    [userId, userEmail] = await insertUser("u1@test.com");
    [user2Id, user2Email] = await insertUser("u2@test.com");
    parcelId = await insertParcel(userId, { name: "Lote Norte" });
  });

  const validCrop = {
    parcel_id: 0, // replaced in each test
    variety: "Maíz",
    planting_date: "2026-03-15",
    status: "en_crecimiento",
  };

  it("creates a crop and returns 201", async () => {
    const res = await request(app)
      .post("/api/crops")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ ...validCrop, parcel_id: parcelId });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.variety).toBe("Maíz");
    expect(res.body.parcel_id).toBe(parcelId);
    expect(res.body.status).toBe("en_crecimiento");
    expect(res.body.planting_date).toBe("2026-03-15");
    expect(res.body).toHaveProperty("created_at");
    expect(res.body).toHaveProperty("updated_at");
  });

  it("creates a crop with optional fields", async () => {
    const res = await request(app)
      .post("/api/crops")
      .set("Authorization", authHeader(userId, userEmail))
      .send({
        parcel_id: parcelId,
        variety: "Trigo",
        planting_date: "2026-04-01",
        status: "planificado",
        estimated_harvest_date: "2026-08-15",
        planting_density: 120.5,
        notes: "Semillas certificadas",
      });

    expect(res.status).toBe(201);
    expect(res.body.estimated_harvest_date).toBe("2026-08-15");
    expect(res.body.planting_density).toBe(120.5);
    expect(res.body.notes).toBe("Semillas certificadas");
  });

  it("returns 400 when variety is empty", async () => {
    const res = await request(app)
      .post("/api/crops")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ ...validCrop, parcel_id: parcelId, variety: "" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Variety is required");
  });

  it("returns 400 when status is invalid", async () => {
    const res = await request(app)
      .post("/api/crops")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ ...validCrop, parcel_id: parcelId, status: "invalid_value" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 400 when planting_date format is invalid", async () => {
    const res = await request(app)
      .post("/api/crops")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ ...validCrop, parcel_id: parcelId, planting_date: "15-03-2026" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid date format");
  });

  it("returns 404 when parcel does not belong to user", async () => {
    // User 2 also has a parcel, but we try to create a crop on it from user 1
    const user2ParcelId = await insertParcel(user2Id, { name: "User2 Parcel" });

    const res = await request(app)
      .post("/api/crops")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ ...validCrop, parcel_id: user2ParcelId });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Parcel not found");
  });

  it("returns 401 when no auth token provided", async () => {
    const res = await request(app)
      .post("/api/crops")
      .send({ ...validCrop, parcel_id: parcelId });

    expect(res.status).toBe(401);
  });
});

// ── Update crop ─────────────────────────────────────────────────────────

describe("PUT /api/crops/:id — update", () => {
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
    cropId = await insertCrop(parcelId, {
      variety: "Trigo",
      planting_date: "2026-03-01",
      status: "planificado",
    });
  });

  it("updates the crop and returns 200", async () => {
    const res = await request(app)
      .put(`/api/crops/${cropId}`)
      .set("Authorization", authHeader(userId, userEmail))
      .send({ variety: "Cebada", status: "en_crecimiento" });

    expect(res.status).toBe(200);
    expect(res.body.variety).toBe("Cebada");
    expect(res.body.status).toBe("en_crecimiento");
    expect(res.body.updated_at).not.toBeNull();
    // untouched fields should remain
    expect(res.body.planting_date).toBe("2026-03-01");
  });

  it("returns 404 when another user tries to update", async () => {
    const res = await request(app)
      .put(`/api/crops/${cropId}`)
      .set("Authorization", authHeader(user2Id, user2Email))
      .send({ variety: "Hacked" });

    expect(res.status).toBe(404);
  });

  it("returns 400 when no fields provided", async () => {
    const res = await request(app)
      .put(`/api/crops/${cropId}`)
      .set("Authorization", authHeader(userId, userEmail))
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("No fields to update");
  });

  it("returns 404 for non-existent crop id", async () => {
    const res = await request(app)
      .put("/api/crops/99999")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ variety: "Test" });

    expect(res.status).toBe(404);
  });
});

// ── Delete crop ─────────────────────────────────────────────────────────

describe("DELETE /api/crops/:id — delete", () => {
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
    cropId = await insertCrop(parcelId, {
      variety: "Maíz",
      status: "cosechado",
    });
  });

  it("deletes the crop and returns 204", async () => {
    const res = await request(app)
      .delete(`/api/crops/${cropId}`)
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(204);

    // Verify it's gone
    const getRes = await request(app)
      .get(`/api/crops/${cropId}`)
      .set("Authorization", authHeader(userId, userEmail));
    expect(getRes.status).toBe(404);
  });

  it("returns 404 when another user tries to delete", async () => {
    const res = await request(app)
      .delete(`/api/crops/${cropId}`)
      .set("Authorization", authHeader(user2Id, user2Email));

    expect(res.status).toBe(404);
  });

  it("returns 404 for non-existent id", async () => {
    const res = await request(app)
      .delete("/api/crops/99999")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(404);
  });
});
