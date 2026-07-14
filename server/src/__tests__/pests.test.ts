import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import db from "../db/connection.js";
import { createApp } from "../app.js";

const app = createApp();
const JWT_SECRET = process.env.JWT_SECRET!;

function tokenFor(userId: number, email: string): string {
  return jwt.sign({ id: userId, email, role: "admin" }, JWT_SECRET, { expiresIn: "7d" });
}

function authHeader(userId: number, email: string): string {
  return `Bearer ${tokenFor(userId, email)}`;
}

async function insertUser(email: string): Promise<[number, string]> {
  const [id] = await db("users").insert({
    email,
    password_hash: "ignored-in-tests",
  });
  return [id, email];
}

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

async function insertCrop(
  parcelId: number,
  overrides: Partial<{
    variety: string;
    planting_date: string;
    status: string;
  }> = {}
): Promise<number> {
  const [id] = await db("crops").insert({
    parcel_id: parcelId,
    variety: overrides.variety ?? "Maíz",
    planting_date: overrides.planting_date ?? "2026-03-15",
    status: overrides.status ?? "en_crecimiento",
  });
  return id;
}

async function insertPest(
  cropId: number,
  userId: number,
  overrides: Partial<{
    tipo: string;
    nombre: string;
    severidad: string;
    fecha_deteccion: string;
    estado: string;
    tratamiento: string;
    notas: string;
  }> = {}
): Promise<number> {
  const [id] = await db("pests").insert({
    crop_id: cropId,
    user_id: userId,
    tipo: overrides.tipo ?? "plaga",
    nombre: overrides.nombre ?? "Pulgón",
    severidad: overrides.severidad ?? "media",
    fecha_deteccion: overrides.fecha_deteccion ?? "2026-07-01",
    estado: overrides.estado ?? "activo",
    tratamiento: overrides.tratamiento ?? null,
    notas: overrides.notas ?? null,
  });
  return id;
}

beforeAll(async () => {
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
  if (!(await db.schema.hasTable("pests"))) {
    await db.schema.createTable("pests", (table) => {
      table.increments("id").primary();
      table
        .integer("crop_id")
        .notNullable()
        .references("id")
        .inTable("crops")
        .onDelete("CASCADE");
      table.text("tipo").notNullable();
      table.text("nombre").notNullable();
      table.text("severidad").notNullable();
      table.text("fecha_deteccion").notNullable();
      table.text("tratamiento");
      table.text("estado").notNullable();
      table.text("notas");
      table.integer("user_id").notNullable();
      table.text("created_at").notNullable().defaultTo(db.fn.now());
      table.text("updated_at").notNullable().defaultTo(db.fn.now());
    });
  }
});

beforeEach(async () => {
  await db("pests").del();
  await db("crops").del();
  await db("parcels").del();
  await db("users").del();
});

// ── Auth guard ──────────────────────────────────────────────────────────

describe("Authentication guard", () => {
  it("returns 401 when no Authorization header is present", async () => {
    const res = await request(app).get("/api/pests");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Authentication required");
  });

  it("returns 401 when token is missing Bearer prefix", async () => {
    const tok = jwt.sign({ id: 1, email: "x@t.com" }, JWT_SECRET);
    const res = await request(app)
      .get("/api/pests")
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
      .get("/api/pests")
      .set("Authorization", `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });
});

// ── List pests ──────────────────────────────────────────────────────────

describe("GET /api/pests — list", () => {
  let userId: number;
  let userEmail: string;
  let cropId: number;

  beforeEach(async () => {
    [userId, userEmail] = await insertUser("u1@test.com");
    const parcelId = await insertParcel(userId, { name: "Lote Norte" });
    cropId = await insertCrop(parcelId, { variety: "Maíz" });
  });

  it("returns empty array when user has no pests", async () => {
    const res = await request(app)
      .get("/api/pests")
      .set("Authorization", authHeader(userId, userEmail));
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns all pests for the authenticated user", async () => {
    await insertPest(cropId, userId, { nombre: "Pulgón" });
    await insertPest(cropId, userId, { nombre: "Oídio" });

    const res = await request(app)
      .get("/api/pests")
      .set("Authorization", authHeader(userId, userEmail));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it("only returns pests for the authenticated user (not others)", async () => {
    const [user2Id] = await insertUser("u2@test.com");
    const parcel2Id = await insertParcel(user2Id, { name: "Lote Sur" });
    const crop2Id = await insertCrop(parcel2Id, { variety: "Trigo" });

    await insertPest(cropId, userId, { nombre: "User1 Pest" });
    await insertPest(crop2Id, user2Id, { nombre: "User2 Pest" });

    const res = await request(app)
      .get("/api/pests")
      .set("Authorization", authHeader(userId, userEmail));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].nombre).toBe("User1 Pest");
  });

  it("filters by tipo query param", async () => {
    await insertPest(cropId, userId, { nombre: "Pulgón", tipo: "plaga" });
    await insertPest(cropId, userId, { nombre: "Oídio", tipo: "enfermedad" });

    const res = await request(app)
      .get("/api/pests?tipo=plaga")
      .set("Authorization", authHeader(userId, userEmail));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].tipo).toBe("plaga");
  });

  it("filters by estado query param", async () => {
    await insertPest(cropId, userId, { nombre: "Pulgón", estado: "activo" });
    await insertPest(cropId, userId, { nombre: "Oídio", estado: "controlado" });

    const res = await request(app)
      .get("/api/pests?estado=controlado")
      .set("Authorization", authHeader(userId, userEmail));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].estado).toBe("controlado");
  });

  it("searches by nombre (case-insensitive LIKE)", async () => {
    await insertPest(cropId, userId, { nombre: "Pulgón" });
    await insertPest(cropId, userId, { nombre: "Oídio" });
    await insertPest(cropId, userId, { nombre: "Mosca blanca" });

    const res = await request(app)
      .get("/api/pests?nombre=pul")
      .set("Authorization", authHeader(userId, userEmail));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].nombre).toBe("Pulgón");
  });
});

// ── Get single pest ─────────────────────────────────────────────────────

describe("GET /api/pests/:id — get by id", () => {
  let userId: number;
  let userEmail: string;
  let user2Id: number;
  let user2Email: string;
  let cropId: number;
  let pestId: number;

  beforeEach(async () => {
    [userId, userEmail] = await insertUser("u1@test.com");
    [user2Id, user2Email] = await insertUser("u2@test.com");
    const parcelId = await insertParcel(userId, { name: "Lote Norte" });
    cropId = await insertCrop(parcelId, { variety: "Maíz" });
    pestId = await insertPest(cropId, userId, {
      nombre: "Pulgón",
      tipo: "plaga",
      severidad: "alta",
      fecha_deteccion: "2026-07-01",
      estado: "activo",
    });
  });

  it("returns the pest with crop name for the owning user", async () => {
    const res = await request(app)
      .get(`/api/pests/${pestId}`)
      .set("Authorization", authHeader(userId, userEmail));
    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe("Pulgón");
    expect(res.body.crop_id).toBe(cropId);
    expect(res.body.tipo).toBe("plaga");
    expect(res.body.severidad).toBe("alta");
    expect(res.body.estado).toBe("activo");
    expect(res.body.crop_name).toBe("Maíz");
    expect(res.body).toHaveProperty("created_at");
    expect(res.body).toHaveProperty("updated_at");
  });

  it("returns 404 when another user tries to access", async () => {
    const res = await request(app)
      .get(`/api/pests/${pestId}`)
      .set("Authorization", authHeader(user2Id, user2Email));
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Pest not found");
  });

  it("returns 404 for non-existent pest id", async () => {
    const res = await request(app)
      .get("/api/pests/99999")
      .set("Authorization", authHeader(userId, userEmail));
    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid pest id", async () => {
    const res = await request(app)
      .get("/api/pests/notanumber")
      .set("Authorization", authHeader(userId, userEmail));
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid pest ID");
  });
});

// ── Create pest ─────────────────────────────────────────────────────────

describe("POST /api/pests — create", () => {
  let userId: number;
  let userEmail: string;
  let user2Id: number;
  let user2Email: string;
  let cropId: number;

  beforeEach(async () => {
    [userId, userEmail] = await insertUser("u1@test.com");
    [user2Id, user2Email] = await insertUser("u2@test.com");
    const parcelId = await insertParcel(userId, { name: "Lote Norte" });
    cropId = await insertCrop(parcelId, { variety: "Maíz" });
  });

  const validPest = {
    tipo: "plaga",
    nombre: "Pulgón",
    severidad: "media",
    fecha_deteccion: "2026-07-01",
    estado: "activo",
  };

  it("creates a pest and returns 201", async () => {
    const res = await request(app)
      .post("/api/pests")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ ...validPest, crop_id: cropId });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.nombre).toBe("Pulgón");
    expect(res.body.crop_id).toBe(cropId);
    expect(res.body.tipo).toBe("plaga");
    expect(res.body.severidad).toBe("media");
    expect(res.body.estado).toBe("activo");
    expect(res.body.fecha_deteccion).toBe("2026-07-01");
    expect(res.body.user_id).toBe(userId);
    expect(res.body).toHaveProperty("created_at");
    expect(res.body).toHaveProperty("updated_at");
  });

  it("creates a pest with optional fields", async () => {
    const res = await request(app)
      .post("/api/pests")
      .set("Authorization", authHeader(userId, userEmail))
      .send({
        crop_id: cropId,
        tipo: "enfermedad",
        nombre: "Oídio",
        severidad: "alta",
        fecha_deteccion: "2026-06-15",
        estado: "activo",
        tratamiento: "Aceite de neem",
        notas: "Aplicar cada 7 días",
      });
    expect(res.status).toBe(201);
    expect(res.body.tratamiento).toBe("Aceite de neem");
    expect(res.body.notas).toBe("Aplicar cada 7 días");
    expect(res.body.tipo).toBe("enfermedad");
    expect(res.body.severidad).toBe("alta");
  });

  it("returns 400 when nombre is empty", async () => {
    const res = await request(app)
      .post("/api/pests")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ ...validPest, crop_id: cropId, nombre: "" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Name is required");
  });

  it("returns 400 when tipo is invalid", async () => {
    const res = await request(app)
      .post("/api/pests")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ ...validPest, crop_id: cropId, tipo: "hongo" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 400 when severidad is invalid", async () => {
    const res = await request(app)
      .post("/api/pests")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ ...validPest, crop_id: cropId, severidad: "crítica" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 400 when estado is invalid", async () => {
    const res = await request(app)
      .post("/api/pests")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ ...validPest, crop_id: cropId, estado: "pendiente" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 404 when crop does not belong to user", async () => {
    const parcel2Id = await insertParcel(user2Id, { name: "User2 Parcel" });
    const user2CropId = await insertCrop(parcel2Id, { variety: "Trigo" });

    const res = await request(app)
      .post("/api/pests")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ ...validPest, crop_id: user2CropId });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Crop not found");
  });

  it("returns 401 when no auth token provided", async () => {
    const res = await request(app)
      .post("/api/pests")
      .send({ ...validPest, crop_id: cropId });
    expect(res.status).toBe(401);
  });
});

// ── Update pest ─────────────────────────────────────────────────────────

describe("PUT /api/pests/:id — update", () => {
  let userId: number;
  let userEmail: string;
  let user2Id: number;
  let user2Email: string;
  let cropId: number;
  let pestId: number;

  beforeEach(async () => {
    [userId, userEmail] = await insertUser("u1@test.com");
    [user2Id, user2Email] = await insertUser("u2@test.com");
    const parcelId = await insertParcel(userId, { name: "Lote Norte" });
    cropId = await insertCrop(parcelId, { variety: "Maíz" });
    pestId = await insertPest(cropId, userId, {
      nombre: "Pulgón",
      tipo: "plaga",
      severidad: "media",
      estado: "activo",
      fecha_deteccion: "2026-07-01",
    });
  });

  it("updates the pest and returns 200 with refreshed updated_at", async () => {
    const res = await request(app)
      .put(`/api/pests/${pestId}`)
      .set("Authorization", authHeader(userId, userEmail))
      .send({
        estado: "controlado",
        tratamiento: "Aceite de neem",
        severidad: "baja",
      });
    expect(res.status).toBe(200);
    expect(res.body.estado).toBe("controlado");
    expect(res.body.tratamiento).toBe("Aceite de neem");
    expect(res.body.severidad).toBe("baja");
    expect(res.body.updated_at).not.toBeNull();
    expect(res.body.nombre).toBe("Pulgón");
    expect(res.body.tipo).toBe("plaga");
  });

  it("returns 404 when another user tries to update", async () => {
    const res = await request(app)
      .put(`/api/pests/${pestId}`)
      .set("Authorization", authHeader(user2Id, user2Email))
      .send({ nombre: "Hacked" });
    expect(res.status).toBe(404);
  });

  it("returns 400 when no fields provided", async () => {
    const res = await request(app)
      .put(`/api/pests/${pestId}`)
      .set("Authorization", authHeader(userId, userEmail))
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("No fields to update");
  });

  it("returns 404 for non-existent pest id", async () => {
    const res = await request(app)
      .put("/api/pests/99999")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ nombre: "Test" });
    expect(res.status).toBe(404);
  });
});

// ── Delete pest ─────────────────────────────────────────────────────────

describe("DELETE /api/pests/:id — delete", () => {
  let userId: number;
  let userEmail: string;
  let user2Id: number;
  let user2Email: string;
  let cropId: number;
  let pestId: number;

  beforeEach(async () => {
    [userId, userEmail] = await insertUser("u1@test.com");
    [user2Id, user2Email] = await insertUser("u2@test.com");
    const parcelId = await insertParcel(userId, { name: "Lote Norte" });
    cropId = await insertCrop(parcelId, { variety: "Maíz" });
    pestId = await insertPest(cropId, userId, {
      nombre: "Pulgón",
      estado: "activo",
    });
  });

  it("deletes the pest and returns 204", async () => {
    const res = await request(app)
      .delete(`/api/pests/${pestId}`)
      .set("Authorization", authHeader(userId, userEmail));
    expect(res.status).toBe(204);

    const getRes = await request(app)
      .get(`/api/pests/${pestId}`)
      .set("Authorization", authHeader(userId, userEmail));
    expect(getRes.status).toBe(404);
  });

  it("returns 404 when another user tries to delete", async () => {
    const res = await request(app)
      .delete(`/api/pests/${pestId}`)
      .set("Authorization", authHeader(user2Id, user2Email));
    expect(res.status).toBe(404);
  });

  it("verifies CASCADE delete removes pests when crop is deleted", async () => {
    await insertPest(cropId, userId, { nombre: "Pest A" });
    await insertPest(cropId, userId, { nombre: "Pest B" });
    await insertPest(cropId, userId, { nombre: "Pest C" });

    const before = await request(app)
      .get("/api/pests")
      .set("Authorization", authHeader(userId, userEmail));
    expect(before.body).toHaveLength(4);

    const deleteCropRes = await request(app)
      .delete(`/api/crops/${cropId}`)
      .set("Authorization", authHeader(userId, userEmail));
    expect(deleteCropRes.status).toBe(204);

    const after = await request(app)
      .get("/api/pests")
      .set("Authorization", authHeader(userId, userEmail));
    expect(after.body).toHaveLength(0);
  });
});
