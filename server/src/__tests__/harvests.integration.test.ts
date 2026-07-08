import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import db from "../db/connection.js";
import { createApp } from "../app.js";

const app = createApp();
const JWT_SECRET = process.env.JWT_SECRET!;

/**
 * Harvest routes tests (Change — harvest-management)
 *
 * Scenarios covered:
 * - Auth guard (401)
 * - List all user harvests + crop_id/date_from/date_to filters
 * - Get single harvest by id (own, cross-user 404, invalid id 400)
 * - Create with validation (cantidad>0, unidad enum, date format) + crop ownership check
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

/** Insert a harvest for a given crop_id */
async function insertHarvest(
  cropId: number,
  overrides: Partial<{
    cantidad: number;
    unidad: string;
    fecha_cosecha: string;
    rendimiento: number;
    perdidas: number;
    notas: string;
  }> = {}
): Promise<number> {
  const [id] = await db("harvests").insert({
    crop_id: cropId,
    cantidad: overrides.cantidad ?? 500,
    unidad: overrides.unidad ?? "kg",
    fecha_cosecha: overrides.fecha_cosecha ?? "2026-06-15",
    rendimiento: overrides.rendimiento ?? null,
    perdidas: overrides.perdidas ?? null,
    notas: overrides.notas ?? null,
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
  if (!(await db.schema.hasTable("harvests"))) {
    await db.schema.createTable("harvests", (table) => {
      table.increments("id").primary();
      table
        .integer("crop_id")
        .notNullable()
        .references("id")
        .inTable("crops")
        .onDelete("CASCADE");
      table.float("cantidad").notNullable();
      table.text("unidad").notNullable();
      table.text("fecha_cosecha").notNullable();
      table.float("rendimiento");
      table.float("perdidas");
      table.text("notas");
      table.text("created_at").notNullable().defaultTo(db.fn.now());
      table.text("updated_at").notNullable().defaultTo(db.fn.now());
    });
  }
});

beforeEach(async () => {
  // Clean up in reverse FK order
  await db("harvests").del();
  await db("crops").del();
  await db("parcels").del();
  await db("users").del();
});

// ── Auth guard ──────────────────────────────────────────────────────────

describe("Authentication guard", () => {
  it("returns 401 when no Authorization header is present", async () => {
    const res = await request(app).get("/api/harvests");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Authentication required");
  });

  it("returns 401 when token is missing Bearer prefix", async () => {
    const tok = jwt.sign({ id: 1, email: "x@t.com" }, JWT_SECRET);
    const res = await request(app)
      .get("/api/harvests")
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
      .get("/api/harvests")
      .set("Authorization", `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });
});

// ── List harvests ─────────────────────────────────────────────────────

describe("GET /api/harvests — list", () => {
  let userId: number;
  let userEmail: string;
  let parcelId: number;
  let cropId: number;

  beforeEach(async () => {
    [userId, userEmail] = await insertUser("u1@test.com");
    parcelId = await insertParcel(userId, { name: "Lote Norte" });
    cropId = await insertCrop(parcelId, { variety: "Maíz" });
  });

  it("returns empty array when user has no harvests", async () => {
    const res = await request(app)
      .get("/api/harvests")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns all harvests for the authenticated user", async () => {
    await insertHarvest(cropId, { cantidad: 500, unidad: "kg" });
    await insertHarvest(cropId, { cantidad: 2, unidad: "ton" });

    const res = await request(app)
      .get("/api/harvests")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toHaveProperty("cantidad");
    expect(res.body[0]).toHaveProperty("unidad");
    expect(res.body[0]).toHaveProperty("fecha_cosecha");
  });

  it("only returns harvests scoped to the authenticated user (two-JOIN isolation)", async () => {
    const [user2Id, user2Email] = await insertUser("u2@test.com");
    const parcel2Id = await insertParcel(user2Id, { name: "Lote Sur" });
    const crop2Id = await insertCrop(parcel2Id, { variety: "Trigo" });

    await insertHarvest(cropId, {
      cantidad: 500,
      unidad: "kg",
      notas: "user1-harvest",
    });
    await insertHarvest(crop2Id, {
      cantidad: 1000,
      unidad: "kg",
      notas: "user2-harvest",
    });

    const res = await request(app)
      .get("/api/harvests")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].notas).toBe("user1-harvest");
  });

  it("filters by crop_id query param", async () => {
    const crop2Id = await insertCrop(parcelId, { variety: "Trigo" });
    await insertHarvest(cropId, { cantidad: 500, unidad: "kg" });
    await insertHarvest(crop2Id, { cantidad: 1000, unidad: "ton" });

    const res = await request(app)
      .get(`/api/harvests?crop_id=${crop2Id}`)
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].cantidad).toBe(1000);
  });

  it("filters by date_from (>=)", async () => {
    await insertHarvest(cropId, {
      cantidad: 500,
      fecha_cosecha: "2026-01-15",
      unidad: "kg",
    });
    await insertHarvest(cropId, {
      cantidad: 800,
      fecha_cosecha: "2026-03-20",
      unidad: "kg",
    });
    await insertHarvest(cropId, {
      cantidad: 1200,
      fecha_cosecha: "2026-06-10",
      unidad: "kg",
    });

    const res = await request(app)
      .get("/api/harvests?date_from=2026-03-01")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    const dates = res.body.map((h: { fecha_cosecha: string }) => h.fecha_cosecha);
    expect(dates).toContain("2026-03-20");
    expect(dates).toContain("2026-06-10");
  });

  it("filters by date_to (<=)", async () => {
    await insertHarvest(cropId, {
      cantidad: 500,
      fecha_cosecha: "2026-01-15",
      unidad: "kg",
    });
    await insertHarvest(cropId, {
      cantidad: 800,
      fecha_cosecha: "2026-06-10",
      unidad: "kg",
    });

    const res = await request(app)
      .get("/api/harvests?date_to=2026-05-01")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].fecha_cosecha).toBe("2026-01-15");
  });

  it("filters by date_from and date_to combined", async () => {
    await insertHarvest(cropId, {
      cantidad: 500,
      fecha_cosecha: "2026-01-15",
      unidad: "kg",
    });
    await insertHarvest(cropId, {
      cantidad: 800,
      fecha_cosecha: "2026-03-20",
      unidad: "kg",
    });
    await insertHarvest(cropId, {
      cantidad: 1200,
      fecha_cosecha: "2026-06-10",
      unidad: "kg",
    });

    const res = await request(app)
      .get("/api/harvests?date_from=2026-02-01&date_to=2026-05-01")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].fecha_cosecha).toBe("2026-03-20");
  });

  it("combines crop_id and date filters", async () => {
    const crop2Id = await insertCrop(parcelId, { variety: "Trigo" });
    await insertHarvest(cropId, { cantidad: 500, fecha_cosecha: "2026-03-20", unidad: "kg" });
    await insertHarvest(cropId, { cantidad: 300, fecha_cosecha: "2026-03-20", unidad: "ton" });
    await insertHarvest(crop2Id, { cantidad: 1000, fecha_cosecha: "2026-03-20", unidad: "kg" });

    const res = await request(app)
      .get(`/api/harvests?crop_id=${cropId}&date_from=2026-01-01&date_to=2026-12-31`)
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].crop_id).toBe(cropId);
    expect(res.body[1].crop_id).toBe(cropId);
  });
});

// ── Get single harvest ────────────────────────────────────────────────

describe("GET /api/harvests/:id — get by id", () => {
  let userId: number;
  let userEmail: string;
  let user2Id: number;
  let user2Email: string;
  let parcelId: number;
  let cropId: number;
  let harvestId: number;

  beforeEach(async () => {
    [userId, userEmail] = await insertUser("u1@test.com");
    [user2Id, user2Email] = await insertUser("u2@test.com");
    parcelId = await insertParcel(userId, { name: "Lote Norte" });
    cropId = await insertCrop(parcelId, { variety: "Maíz" });
    harvestId = await insertHarvest(cropId, {
      cantidad: 750.5,
      fecha_cosecha: "2026-06-10",
      unidad: "kg",
      rendimiento: 12.5,
      perdidas: 50,
      notas: "Cosecha principal",
    });
  });

  it("returns the harvest for the owning user", async () => {
    const res = await request(app)
      .get(`/api/harvests/${harvestId}`)
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body.cantidad).toBe(750.5);
    expect(res.body.fecha_cosecha).toBe("2026-06-10");
    expect(res.body.unidad).toBe("kg");
    expect(res.body.rendimiento).toBe(12.5);
    expect(res.body.perdidas).toBe(50);
    expect(res.body.notas).toBe("Cosecha principal");
    expect(res.body.crop_id).toBe(cropId);
    expect(res.body).toHaveProperty("created_at");
    expect(res.body).toHaveProperty("updated_at");
  });

  it("returns 404 when another user tries to access", async () => {
    const res = await request(app)
      .get(`/api/harvests/${harvestId}`)
      .set("Authorization", authHeader(user2Id, user2Email));

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Harvest not found");
  });

  it("returns 404 for non-existent harvest id", async () => {
    const res = await request(app)
      .get("/api/harvests/99999")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid harvest id", async () => {
    const res = await request(app)
      .get("/api/harvests/notanumber")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid harvest ID");
  });
});

// ── Create harvest ────────────────────────────────────────────────────

describe("POST /api/harvests — create", () => {
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

  const validHarvest = {
    crop_id: 0, // replaced in each test
    cantidad: 500,
    unidad: "kg",
    fecha_cosecha: "2026-06-10",
  };

  it("creates a harvest and returns 201", async () => {
    const res = await request(app)
      .post("/api/harvests")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ ...validHarvest, crop_id: cropId });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.cantidad).toBe(500);
    expect(res.body.crop_id).toBe(cropId);
    expect(res.body.fecha_cosecha).toBe("2026-06-10");
    expect(res.body.unidad).toBe("kg");
    expect(res.body).toHaveProperty("created_at");
    expect(res.body).toHaveProperty("updated_at");
  });

  it("creates a harvest with all optional fields", async () => {
    const res = await request(app)
      .post("/api/harvests")
      .set("Authorization", authHeader(userId, userEmail))
      .send({
        crop_id: cropId,
        cantidad: 3000,
        unidad: "ton",
        fecha_cosecha: "2026-07-01",
        rendimiento: 15,
        perdidas: 100,
        notas: "Cosecha excelente",
      });

    expect(res.status).toBe(201);
    expect(res.body.rendimiento).toBe(15);
    expect(res.body.perdidas).toBe(100);
    expect(res.body.notas).toBe("Cosecha excelente");
    expect(res.body.unidad).toBe("ton");
  });

  it("returns 400 when cantidad is not positive (cantidad=0)", async () => {
    const res = await request(app)
      .post("/api/harvests")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ ...validHarvest, crop_id: cropId, cantidad: 0 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("La cantidad debe ser mayor a 0");
  });

  it("returns 400 when cantidad is negative", async () => {
    const res = await request(app)
      .post("/api/harvests")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ ...validHarvest, crop_id: cropId, cantidad: -5 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("La cantidad debe ser mayor a 0");
  });

  it("returns 400 when unidad is invalid", async () => {
    const res = await request(app)
      .post("/api/harvests")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ ...validHarvest, crop_id: cropId, unidad: "litros" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 400 when fecha_cosecha format is invalid", async () => {
    const res = await request(app)
      .post("/api/harvests")
      .set("Authorization", authHeader(userId, userEmail))
      .send({
        ...validHarvest,
        crop_id: cropId,
        fecha_cosecha: "10-06-2026",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Formato de fecha inválido");
  });

  it("returns 400 when rendimiento is negative", async () => {
    const res = await request(app)
      .post("/api/harvests")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ ...validHarvest, crop_id: cropId, rendimiento: -1 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("El rendimiento no puede ser negativo");
  });

  it("returns 400 when perdidas is negative", async () => {
    const res = await request(app)
      .post("/api/harvests")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ ...validHarvest, crop_id: cropId, perdidas: -1 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Las pérdidas no pueden ser negativas");
  });

  it("returns 400 when crop_id is missing", async () => {
    const res = await request(app)
      .post("/api/harvests")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ cantidad: 500, unidad: "kg", fecha_cosecha: "2026-06-10" });

    expect(res.status).toBe(400);
  });

  it("returns 404 when crop does not belong to user (cross-user crop)", async () => {
    const user2ParcelId = await insertParcel(user2Id, { name: "User2 Parcel" });
    const user2CropId = await insertCrop(user2ParcelId, { variety: "User2 Crop" });

    const res = await request(app)
      .post("/api/harvests")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ ...validHarvest, crop_id: user2CropId });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Crop not found");
  });

  it("returns 401 when no auth token provided", async () => {
    const res = await request(app)
      .post("/api/harvests")
      .send({ ...validHarvest, crop_id: cropId });

    expect(res.status).toBe(401);
  });
});

// ── Update harvest ────────────────────────────────────────────────────

describe("PUT /api/harvests/:id — update", () => {
  let userId: number;
  let userEmail: string;
  let user2Id: number;
  let user2Email: string;
  let parcelId: number;
  let cropId: number;
  let harvestId: number;

  beforeEach(async () => {
    [userId, userEmail] = await insertUser("u1@test.com");
    [user2Id, user2Email] = await insertUser("u2@test.com");
    parcelId = await insertParcel(userId, { name: "Lote Norte" });
    cropId = await insertCrop(parcelId, { variety: "Maíz" });
    harvestId = await insertHarvest(cropId, {
      cantidad: 500,
      fecha_cosecha: "2026-06-10",
      unidad: "kg",
      notas: "Original",
    });
  });

  it("updates the harvest and returns 200", async () => {
    const res = await request(app)
      .put(`/api/harvests/${harvestId}`)
      .set("Authorization", authHeader(userId, userEmail))
      .send({ cantidad: 750, unidad: "ton" });

    expect(res.status).toBe(200);
    expect(res.body.cantidad).toBe(750);
    expect(res.body.unidad).toBe("ton");
    expect(res.body.notas).toBe("Original"); // untouched
    expect(res.body.fecha_cosecha).toBe("2026-06-10"); // untouched
  });

  it("returns 200 when updating with optional fields", async () => {
    const res = await request(app)
      .put(`/api/harvests/${harvestId}`)
      .set("Authorization", authHeader(userId, userEmail))
      .send({ rendimiento: 12, perdidas: 30, notas: "Updated notes" });

    expect(res.status).toBe(200);
    expect(res.body.rendimiento).toBe(12);
    expect(res.body.perdidas).toBe(30);
    expect(res.body.notas).toBe("Updated notes");
  });

  it("returns 404 when another user tries to update", async () => {
    const res = await request(app)
      .put(`/api/harvests/${harvestId}`)
      .set("Authorization", authHeader(user2Id, user2Email))
      .send({ cantidad: 999 });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Harvest not found");
  });

  it("returns 404 when crop_id is changed to an unowned crop", async () => {
    const user2ParcelId = await insertParcel(user2Id, { name: "User2 Parcel" });
    const user2CropId = await insertCrop(user2ParcelId, { variety: "User2 Crop" });

    const res = await request(app)
      .put(`/api/harvests/${harvestId}`)
      .set("Authorization", authHeader(userId, userEmail))
      .send({ crop_id: user2CropId });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Harvest not found");
  });

  it("returns 200 when crop_id changes to another owned crop", async () => {
    const crop2Id = await insertCrop(parcelId, { variety: "Trigo" });

    const res = await request(app)
      .put(`/api/harvests/${harvestId}`)
      .set("Authorization", authHeader(userId, userEmail))
      .send({ crop_id: crop2Id });

    expect(res.status).toBe(200);
    expect(res.body.crop_id).toBe(crop2Id);
  });

  it("returns 400 when no fields provided", async () => {
    const res = await request(app)
      .put(`/api/harvests/${harvestId}`)
      .set("Authorization", authHeader(userId, userEmail))
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("No fields to update");
  });

  it("returns 404 for non-existent harvest id", async () => {
    const res = await request(app)
      .put("/api/harvests/99999")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ cantidad: 100 });

    expect(res.status).toBe(404);
  });
});

// ── Delete harvest ────────────────────────────────────────────────────

describe("DELETE /api/harvests/:id — delete", () => {
  let userId: number;
  let userEmail: string;
  let user2Id: number;
  let user2Email: string;
  let parcelId: number;
  let cropId: number;
  let harvestId: number;

  beforeEach(async () => {
    [userId, userEmail] = await insertUser("u1@test.com");
    [user2Id, user2Email] = await insertUser("u2@test.com");
    parcelId = await insertParcel(userId, { name: "Lote Norte" });
    cropId = await insertCrop(parcelId, { variety: "Maíz" });
    harvestId = await insertHarvest(cropId, {
      cantidad: 500,
      fecha_cosecha: "2026-06-10",
      unidad: "kg",
    });
  });

  it("deletes the harvest and returns 204", async () => {
    const res = await request(app)
      .delete(`/api/harvests/${harvestId}`)
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(204);

    // Verify it's gone
    const getRes = await request(app)
      .get(`/api/harvests/${harvestId}`)
      .set("Authorization", authHeader(userId, userEmail));
    expect(getRes.status).toBe(404);
  });

  it("returns 404 when another user tries to delete", async () => {
    const res = await request(app)
      .delete(`/api/harvests/${harvestId}`)
      .set("Authorization", authHeader(user2Id, user2Email));

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Harvest not found");
  });

  it("returns 404 for non-existent id", async () => {
    const res = await request(app)
      .delete("/api/harvests/99999")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(404);
  });
});
