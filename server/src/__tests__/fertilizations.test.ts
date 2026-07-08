import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import db from "../db/connection.js";
import { createApp } from "../app.js";

const app = createApp();
const JWT_SECRET = process.env.JWT_SECRET!;

/**
 * Fertilizations route tests (Change: fertilization-management, PR #2)
 *
 * Scenarios covered:
 * - Auth guard (no header, invalid token, malformed header)
 * - List all user fertilizations + crop_id/search/combined filters
 * - Get single fertilization by id
 * - Create with validation + crop ownership check
 * - Update with partial fields + cross-user 404
 * - Delete with cross-user 404
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

/** Insert a fertilization for a given crop_id */
async function insertFertilization(
  cropId: number,
  overrides: Partial<{
    producto: string;
    dosis: number;
    unidad: string;
    fecha_aplicacion: string;
    notas: string;
    costo: number;
  }> = {}
): Promise<number> {
  const [id] = await db("fertilizations").insert({
    crop_id: cropId,
    producto: overrides.producto ?? "Urea",
    dosis: overrides.dosis ?? 150,
    unidad: overrides.unidad ?? "kg/ha",
    fecha_aplicacion: overrides.fecha_aplicacion ?? "2026-05-01",
    notas: overrides.notas ?? null,
    costo: overrides.costo ?? null,
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
  if (!(await db.schema.hasTable("fertilizations"))) {
    await db.schema.createTable("fertilizations", (table) => {
      table.increments("id").primary();
      table
        .integer("crop_id")
        .notNullable()
        .references("id")
        .inTable("crops")
        .onDelete("CASCADE");
      table.text("producto").notNullable();
      table.float("dosis").notNullable();
      table.text("unidad").notNullable();
      table.text("fecha_aplicacion").notNullable();
      table.text("notas");
      table.float("costo");
      table.text("created_at").notNullable().defaultTo(db.fn.now());
      table.text("updated_at").notNullable().defaultTo(db.fn.now());
    });
  }
});

beforeEach(async () => {
  // Clean up in reverse FK order
  await db("fertilizations").del();
  await db("crops").del();
  await db("parcels").del();
  await db("users").del();
});

// ── Auth guard ──────────────────────────────────────────────────────────

describe("Authentication guard", () => {
  it("returns 401 when no Authorization header", async () => {
    const res = await request(app).get("/api/fertilizations");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Authentication required");
  });

  it("returns 401 with invalid token", async () => {
    const res = await request(app)
      .get("/api/fertilizations")
      .set("Authorization", "Bearer invalidtoken123");
    expect(res.status).toBe(401);
  });

  it("returns 401 with malformed header", async () => {
    const tok = jwt.sign({ id: 1, email: "x@t.com" }, JWT_SECRET);
    const res = await request(app)
      .get("/api/fertilizations")
      .set("Authorization", tok);
    expect(res.status).toBe(401);
  });
});

// ── List fertilizations ─────────────────────────────────────────────────

describe("GET /api/fertilizations — list", () => {
  let userId: number;
  let userEmail: string;
  let parcelId: number;
  let cropId: number;

  beforeEach(async () => {
    [userId, userEmail] = await insertUser("u1@test.com");
    parcelId = await insertParcel(userId, { name: "Lote Norte" });
    cropId = await insertCrop(parcelId, { variety: "Maíz" });
  });

  it("returns empty array when no fertilizations exist", async () => {
    const res = await request(app)
      .get("/api/fertilizations")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns only user's fertilizations (cross-user isolation)", async () => {
    const [user2Id] = await insertUser("u2@test.com");
    const parcel2Id = await insertParcel(user2Id, { name: "Lote Sur" });
    const crop2Id = await insertCrop(parcel2Id, { variety: "Trigo" });

    await insertFertilization(cropId, { producto: "Urea" });
    await insertFertilization(crop2Id, { producto: "Fosfato" });

    const res = await request(app)
      .get("/api/fertilizations")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].producto).toBe("Urea");
  });

  it("filters by crop_id", async () => {
    const crop2Id = await insertCrop(parcelId, { variety: "Trigo" });
    await insertFertilization(cropId, { producto: "Urea" });
    await insertFertilization(crop2Id, { producto: "Fosfato" });

    const res = await request(app)
      .get(`/api/fertilizations?crop_id=${crop2Id}`)
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].producto).toBe("Fosfato");
  });

  it("searches by producto", async () => {
    await insertFertilization(cropId, { producto: "Urea" });
    await insertFertilization(cropId, { producto: "Fosfato diamónico" });
    await insertFertilization(cropId, { producto: "Nitrato" });

    const res = await request(app)
      .get("/api/fertilizations?search=fosf")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].producto).toBe("Fosfato diamónico");
  });

  it("combines crop_id and search filters", async () => {
    const crop2Id = await insertCrop(parcelId, { variety: "Trigo" });

    await insertFertilization(cropId, { producto: "Urea" });
    await insertFertilization(cropId, { producto: "Nitrato" });
    await insertFertilization(crop2Id, { producto: "Urea" });

    const res = await request(app)
      .get(`/api/fertilizations?crop_id=${cropId}&search=Urea`)
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].producto).toBe("Urea");
    expect(res.body[0].crop_id).toBe(cropId);
  });

  it("returns fertilizations for authenticated user only", async () => {
    await insertFertilization(cropId, { producto: "Urea" });
    await insertFertilization(cropId, { producto: "Fosfato" });

    const res = await request(app)
      .get("/api/fertilizations")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});

// ── Get single fertilization ────────────────────────────────────────────

describe("GET /api/fertilizations/:id — get by id", () => {
  let userId: number;
  let userEmail: string;
  let user2Id: number;
  let user2Email: string;
  let parcelId: number;
  let cropId: number;
  let fertilizationId: number;

  beforeEach(async () => {
    [userId, userEmail] = await insertUser("u1@test.com");
    [user2Id, user2Email] = await insertUser("u2@test.com");
    parcelId = await insertParcel(userId, { name: "Lote Norte" });
    cropId = await insertCrop(parcelId, {
      variety: "Maíz",
      planting_date: "2026-03-15",
      status: "en_crecimiento",
    });
    fertilizationId = await insertFertilization(cropId, {
      producto: "Urea",
      dosis: 150,
      unidad: "kg/ha",
      fecha_aplicacion: "2026-05-01",
    });
  });

  it("returns fertilization for owner", async () => {
    const res = await request(app)
      .get(`/api/fertilizations/${fertilizationId}`)
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body.producto).toBe("Urea");
    expect(res.body.crop_id).toBe(cropId);
    expect(res.body.dosis).toBe(150);
    expect(res.body.unidad).toBe("kg/ha");
    expect(res.body).toHaveProperty("created_at");
    expect(res.body).toHaveProperty("updated_at");
  });

  it("returns 404 for cross-user fertilization", async () => {
    const res = await request(app)
      .get(`/api/fertilizations/${fertilizationId}`)
      .set("Authorization", authHeader(user2Id, user2Email));

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Fertilización no encontrada");
  });

  it("returns 404 for non-existent id", async () => {
    const res = await request(app)
      .get("/api/fertilizations/99999")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid id (NaN)", async () => {
    const res = await request(app)
      .get("/api/fertilizations/notanumber")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("ID de fertilización inválido");
  });
});

// ── Create fertilization ────────────────────────────────────────────────

describe("POST /api/fertilizations — create", () => {
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
      status: "en_crecimiento",
    });
  });

  const validFertilization = {
    crop_id: 0, // replaced in each test
    producto: "Urea",
    dosis: 150,
    unidad: "kg/ha",
    fecha_aplicacion: "2026-05-01",
  };

  it("returns 201 and created fertilization", async () => {
    const res = await request(app)
      .post("/api/fertilizations")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ ...validFertilization, crop_id: cropId });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.producto).toBe("Urea");
    expect(res.body.crop_id).toBe(cropId);
    expect(res.body.dosis).toBe(150);
    expect(res.body.unidad).toBe("kg/ha");
    expect(res.body.fecha_aplicacion).toBe("2026-05-01");
    expect(res.body).toHaveProperty("created_at");
    expect(res.body).toHaveProperty("updated_at");
  });

  it("includes optional fields (notas, costo)", async () => {
    const res = await request(app)
      .post("/api/fertilizations")
      .set("Authorization", authHeader(userId, userEmail))
      .send({
        crop_id: cropId,
        producto: "Fosfato diamónico",
        dosis: 200,
        unidad: "L/ha",
        fecha_aplicacion: "2026-06-15",
        notas: "Aplicación foliar",
        costo: 350.5,
      });

    expect(res.status).toBe(201);
    expect(res.body.notas).toBe("Aplicación foliar");
    expect(res.body.costo).toBe(350.5);
    expect(res.body.unidad).toBe("L/ha");
  });

  it("returns 400 with empty producto", async () => {
    const res = await request(app)
      .post("/api/fertilizations")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ ...validFertilization, crop_id: cropId, producto: "" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("El producto es requerido");
  });

  it("returns 400 with invalid unidad", async () => {
    const res = await request(app)
      .post("/api/fertilizations")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ ...validFertilization, crop_id: cropId, unidad: "ton/ha" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 400 with invalid date format", async () => {
    const res = await request(app)
      .post("/api/fertilizations")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ ...validFertilization, crop_id: cropId, fecha_aplicacion: "15-03-2026" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Formato de fecha inválido");
  });

  it("returns 404 when crop doesn't belong to user (cross-user crop)", async () => {
    const user2ParcelId = await insertParcel(user2Id, { name: "User2 Parcel" });
    const user2CropId = await insertCrop(user2ParcelId, { variety: "Trigo" });

    const res = await request(app)
      .post("/api/fertilizations")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ ...validFertilization, crop_id: user2CropId });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Cultivo no encontrado");
  });

  it("allows future fecha_aplicacion", async () => {
    const res = await request(app)
      .post("/api/fertilizations")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ ...validFertilization, crop_id: cropId, fecha_aplicacion: "2027-12-15" });

    expect(res.status).toBe(201);
    expect(res.body.fecha_aplicacion).toBe("2027-12-15");
  });
});

// ── Update fertilization ────────────────────────────────────────────────

describe("PUT /api/fertilizations/:id — update", () => {
  let userId: number;
  let userEmail: string;
  let user2Id: number;
  let user2Email: string;
  let parcelId: number;
  let cropId: number;
  let fertilizationId: number;

  beforeEach(async () => {
    [userId, userEmail] = await insertUser("u1@test.com");
    [user2Id, user2Email] = await insertUser("u2@test.com");
    parcelId = await insertParcel(userId, { name: "Lote Norte" });
    cropId = await insertCrop(parcelId, {
      variety: "Trigo",
      planting_date: "2026-03-01",
      status: "planificado",
    });
    fertilizationId = await insertFertilization(cropId, {
      producto: "Urea",
      dosis: 150,
      unidad: "kg/ha",
      fecha_aplicacion: "2026-05-01",
    });
  });

  it("returns 200 with updated fertilization", async () => {
    const res = await request(app)
      .put(`/api/fertilizations/${fertilizationId}`)
      .set("Authorization", authHeader(userId, userEmail))
      .send({ producto: "Fosfato", dosis: 200 });

    expect(res.status).toBe(200);
    expect(res.body.producto).toBe("Fosfato");
    expect(res.body.dosis).toBe(200);
    expect(res.body.updated_at).not.toBeNull();
    // untouched fields should remain
    expect(res.body.unidad).toBe("kg/ha");
    expect(res.body.fecha_aplicacion).toBe("2026-05-01");
  });

  it("returns 404 for cross-user fertilization", async () => {
    const res = await request(app)
      .put(`/api/fertilizations/${fertilizationId}`)
      .set("Authorization", authHeader(user2Id, user2Email))
      .send({ producto: "Hacked" });

    expect(res.status).toBe(404);
  });

  it("returns 400 for empty body", async () => {
    const res = await request(app)
      .put(`/api/fertilizations/${fertilizationId}`)
      .set("Authorization", authHeader(userId, userEmail))
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("No hay campos para actualizar");
  });

  it("returns 404 for non-existent id", async () => {
    const res = await request(app)
      .put("/api/fertilizations/99999")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ producto: "Test" });

    expect(res.status).toBe(404);
  });
});

// ── Delete fertilization ────────────────────────────────────────────────

describe("DELETE /api/fertilizations/:id — delete", () => {
  let userId: number;
  let userEmail: string;
  let user2Id: number;
  let user2Email: string;
  let parcelId: number;
  let cropId: number;
  let fertilizationId: number;

  beforeEach(async () => {
    [userId, userEmail] = await insertUser("u1@test.com");
    [user2Id, user2Email] = await insertUser("u2@test.com");
    parcelId = await insertParcel(userId, { name: "Lote Norte" });
    cropId = await insertCrop(parcelId, {
      variety: "Maíz",
      status: "cosechado",
    });
    fertilizationId = await insertFertilization(cropId, {
      producto: "Urea",
      dosis: 150,
      unidad: "kg/ha",
      fecha_aplicacion: "2026-05-01",
    });
  });

  it("returns 204 and fertilization is gone", async () => {
    const res = await request(app)
      .delete(`/api/fertilizations/${fertilizationId}`)
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(204);

    // Verify it's gone
    const getRes = await request(app)
      .get(`/api/fertilizations/${fertilizationId}`)
      .set("Authorization", authHeader(userId, userEmail));
    expect(getRes.status).toBe(404);
  });

  it("returns 404 for cross-user fertilization", async () => {
    const res = await request(app)
      .delete(`/api/fertilizations/${fertilizationId}`)
      .set("Authorization", authHeader(user2Id, user2Email));

    expect(res.status).toBe(404);
  });

  it("returns 404 for non-existent id", async () => {
    const res = await request(app)
      .delete("/api/fertilizations/99999")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(404);
  });
});
