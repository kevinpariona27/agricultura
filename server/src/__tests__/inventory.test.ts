import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import db from "../db/connection.js";
import { createApp } from "../app.js";

const app = createApp();
const JWT_SECRET = process.env.JWT_SECRET!;

function tokenFor(userId: number, email: string): string {
  return jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: "7d" });
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

async function insertInventoryItem(
  userId: number,
  overrides: Partial<{
    nombre: string;
    categoria: string;
    cantidad: number;
    unidad: string;
    fecha_adquisicion: string;
    fecha_vencimiento: string;
    costo_unitario: number;
    notas: string;
  }> = {}
): Promise<number> {
  const [id] = await db("inventory").insert({
    user_id: userId,
    nombre: overrides.nombre ?? "Fertilizante NPK",
    categoria: overrides.categoria ?? "fertilizante",
    cantidad: overrides.cantidad ?? 50,
    unidad: overrides.unidad ?? "kg",
    fecha_adquisicion: overrides.fecha_adquisicion ?? null,
    fecha_vencimiento: overrides.fecha_vencimiento ?? null,
    costo_unitario: overrides.costo_unitario ?? null,
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
  if (!(await db.schema.hasTable("inventory"))) {
    await db.schema.createTable("inventory", (table) => {
      table.increments("id").primary();
      table
        .integer("user_id")
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table.text("nombre").notNullable();
      table.text("categoria").notNullable();
      table.float("cantidad").notNullable();
      table.text("unidad").notNullable();
      table.text("fecha_adquisicion");
      table.text("fecha_vencimiento");
      table.float("costo_unitario");
      table.text("notas");
      table.text("created_at").notNullable().defaultTo(db.fn.now());
      table.text("updated_at").notNullable().defaultTo(db.fn.now());
    });
  }
});

beforeEach(async () => {
  await db("inventory").del();
  await db("users").del();
});

// ── Auth guard ──────────────────────────────────────────────────────────

describe("Authentication guard", () => {
  it("returns 401 when no Authorization header is present", async () => {
    const res = await request(app).get("/api/inventory");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Authentication required");
  });

  it("returns 401 when token is missing Bearer prefix", async () => {
    const tok = jwt.sign({ id: 1, email: "x@t.com" }, JWT_SECRET);
    const res = await request(app)
      .get("/api/inventory")
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
      .get("/api/inventory")
      .set("Authorization", `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });
});

// ── List inventory ──────────────────────────────────────────────────────

describe("GET /api/inventory — list", () => {
  let userId: number;
  let userEmail: string;

  beforeEach(async () => {
    [userId, userEmail] = await insertUser("u1@test.com");
  });

  it("returns empty array when user has no items", async () => {
    const res = await request(app)
      .get("/api/inventory")
      .set("Authorization", authHeader(userId, userEmail));
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns all inventory items for the authenticated user", async () => {
    await insertInventoryItem(userId, { nombre: "Fertilizante NPK" });
    await insertInventoryItem(userId, { nombre: "Semilla de maíz" });

    const res = await request(app)
      .get("/api/inventory")
      .set("Authorization", authHeader(userId, userEmail));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it("only returns items for the authenticated user (not others)", async () => {
    const [user2Id] = await insertUser("u2@test.com");

    await insertInventoryItem(userId, { nombre: "User1 Item" });
    await insertInventoryItem(user2Id, { nombre: "User2 Item" });

    const res = await request(app)
      .get("/api/inventory")
      .set("Authorization", authHeader(userId, userEmail));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].nombre).toBe("User1 Item");
  });

  it("filters by categoria query param", async () => {
    await insertInventoryItem(userId, {
      nombre: "Fertilizante",
      categoria: "fertilizante",
    });
    await insertInventoryItem(userId, {
      nombre: "Pesticida",
      categoria: "pesticida",
    });

    const res = await request(app)
      .get("/api/inventory?categoria=fertilizante")
      .set("Authorization", authHeader(userId, userEmail));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].categoria).toBe("fertilizante");
  });

  it("searches by nombre (case-insensitive LIKE)", async () => {
    await insertInventoryItem(userId, { nombre: "Fertilizante NPK" });
    await insertInventoryItem(userId, { nombre: "Semilla de maíz" });
    await insertInventoryItem(userId, { nombre: "Pesticida orgánico" });

    const res = await request(app)
      .get("/api/inventory?nombre=ferti")
      .set("Authorization", authHeader(userId, userEmail));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].nombre).toBe("Fertilizante NPK");
  });
});

// ── Get single inventory item ───────────────────────────────────────────

describe("GET /api/inventory/:id — get by id", () => {
  let userId: number;
  let userEmail: string;
  let user2Id: number;
  let user2Email: string;
  let itemId: number;

  beforeEach(async () => {
    [userId, userEmail] = await insertUser("u1@test.com");
    [user2Id, user2Email] = await insertUser("u2@test.com");
    itemId = await insertInventoryItem(userId, {
      nombre: "Fertilizante NPK",
      categoria: "fertilizante",
      cantidad: 50,
      unidad: "kg",
      costo_unitario: 120.5,
    });
  });

  it("returns the item for the owning user", async () => {
    const res = await request(app)
      .get(`/api/inventory/${itemId}`)
      .set("Authorization", authHeader(userId, userEmail));
    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe("Fertilizante NPK");
    expect(res.body.categoria).toBe("fertilizante");
    expect(res.body.cantidad).toBe(50);
    expect(res.body.unidad).toBe("kg");
    expect(res.body.costo_unitario).toBe(120.5);
    expect(res.body).toHaveProperty("created_at");
    expect(res.body).toHaveProperty("updated_at");
  });

  it("returns 404 when another user tries to access", async () => {
    const res = await request(app)
      .get(`/api/inventory/${itemId}`)
      .set("Authorization", authHeader(user2Id, user2Email));
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Inventory item not found");
  });

  it("returns 404 for non-existent id", async () => {
    const res = await request(app)
      .get("/api/inventory/99999")
      .set("Authorization", authHeader(userId, userEmail));
    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid id", async () => {
    const res = await request(app)
      .get("/api/inventory/notanumber")
      .set("Authorization", authHeader(userId, userEmail));
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid inventory ID");
  });
});

// ── Create inventory item ───────────────────────────────────────────────

describe("POST /api/inventory — create", () => {
  let userId: number;
  let userEmail: string;

  beforeEach(async () => {
    [userId, userEmail] = await insertUser("u1@test.com");
  });

  const validItem = {
    nombre: "Fertilizante NPK",
    categoria: "fertilizante",
    cantidad: 50,
    unidad: "kg",
  };

  it("creates an item and returns 201", async () => {
    const res = await request(app)
      .post("/api/inventory")
      .set("Authorization", authHeader(userId, userEmail))
      .send(validItem);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.nombre).toBe("Fertilizante NPK");
    expect(res.body.categoria).toBe("fertilizante");
    expect(res.body.cantidad).toBe(50);
    expect(res.body.unidad).toBe("kg");
    expect(res.body.user_id).toBe(userId);
    expect(res.body).toHaveProperty("created_at");
    expect(res.body).toHaveProperty("updated_at");
  });

  it("creates an item with all optional fields", async () => {
    const res = await request(app)
      .post("/api/inventory")
      .set("Authorization", authHeader(userId, userEmail))
      .send({
        nombre: "Pesticida X",
        categoria: "pesticida",
        cantidad: 10,
        unidad: "L",
        fecha_adquisicion: "2026-06-01",
        fecha_vencimiento: "2027-06-01",
        costo_unitario: 250.75,
        notas: "Usar con precaución",
      });
    expect(res.status).toBe(201);
    expect(res.body.fecha_adquisicion).toBe("2026-06-01");
    expect(res.body.fecha_vencimiento).toBe("2027-06-01");
    expect(res.body.costo_unitario).toBe(250.75);
    expect(res.body.notas).toBe("Usar con precaución");
  });

  it("returns 400 when nombre is empty", async () => {
    const res = await request(app)
      .post("/api/inventory")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ ...validItem, nombre: "" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Name is required");
  });

  it("returns 400 when categoria is invalid", async () => {
    const res = await request(app)
      .post("/api/inventory")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ ...validItem, categoria: "combustible" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 400 when cantidad is not positive", async () => {
    const res = await request(app)
      .post("/api/inventory")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ ...validItem, cantidad: 0 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Quantity must be positive");
  });

  it("returns 400 when unidad is invalid", async () => {
    const res = await request(app)
      .post("/api/inventory")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ ...validItem, unidad: "tonelada" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 400 when fecha_adquisicion format is invalid", async () => {
    const res = await request(app)
      .post("/api/inventory")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ ...validItem, fecha_adquisicion: "01-06-2026" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid date format");
  });

  it("returns 401 when no auth token provided", async () => {
    const res = await request(app).post("/api/inventory").send(validItem);
    expect(res.status).toBe(401);
  });
});

// ── Update inventory item ───────────────────────────────────────────────

describe("PUT /api/inventory/:id — update", () => {
  let userId: number;
  let userEmail: string;
  let user2Id: number;
  let user2Email: string;
  let itemId: number;

  beforeEach(async () => {
    [userId, userEmail] = await insertUser("u1@test.com");
    [user2Id, user2Email] = await insertUser("u2@test.com");
    itemId = await insertInventoryItem(userId, {
      nombre: "Fertilizante NPK",
      categoria: "fertilizante",
      cantidad: 50,
      unidad: "kg",
    });
  });

  it("updates the item and returns 200 with refreshed updated_at", async () => {
    const res = await request(app)
      .put(`/api/inventory/${itemId}`)
      .set("Authorization", authHeader(userId, userEmail))
      .send({
        cantidad: 75,
        costo_unitario: 130,
      });
    expect(res.status).toBe(200);
    expect(res.body.cantidad).toBe(75);
    expect(res.body.costo_unitario).toBe(130);
    expect(res.body.updated_at).not.toBeNull();
    expect(res.body.nombre).toBe("Fertilizante NPK");
  });

  it("returns 404 when another user tries to update", async () => {
    const res = await request(app)
      .put(`/api/inventory/${itemId}`)
      .set("Authorization", authHeader(user2Id, user2Email))
      .send({ nombre: "Hacked" });
    expect(res.status).toBe(404);
  });

  it("returns 400 when no fields provided", async () => {
    const res = await request(app)
      .put(`/api/inventory/${itemId}`)
      .set("Authorization", authHeader(userId, userEmail))
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("No fields to update");
  });

  it("returns 404 for non-existent id", async () => {
    const res = await request(app)
      .put("/api/inventory/99999")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ nombre: "Test" });
    expect(res.status).toBe(404);
  });
});

// ── Delete inventory item ───────────────────────────────────────────────

describe("DELETE /api/inventory/:id — delete", () => {
  let userId: number;
  let userEmail: string;
  let user2Id: number;
  let user2Email: string;
  let itemId: number;

  beforeEach(async () => {
    [userId, userEmail] = await insertUser("u1@test.com");
    [user2Id, user2Email] = await insertUser("u2@test.com");
    itemId = await insertInventoryItem(userId, { nombre: "Fertilizante NPK" });
  });

  it("deletes the item and returns 204", async () => {
    const res = await request(app)
      .delete(`/api/inventory/${itemId}`)
      .set("Authorization", authHeader(userId, userEmail));
    expect(res.status).toBe(204);

    const getRes = await request(app)
      .get(`/api/inventory/${itemId}`)
      .set("Authorization", authHeader(userId, userEmail));
    expect(getRes.status).toBe(404);
  });

  it("returns 404 when another user tries to delete", async () => {
    const res = await request(app)
      .delete(`/api/inventory/${itemId}`)
      .set("Authorization", authHeader(user2Id, user2Email));
    expect(res.status).toBe(404);
  });

  it("returns 404 for non-existent id", async () => {
    const res = await request(app)
      .delete("/api/inventory/99999")
      .set("Authorization", authHeader(userId, userEmail));
    expect(res.status).toBe(404);
  });
});
