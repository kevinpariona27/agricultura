import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import db from "../db/connection.js";
import { createApp } from "../app.js";

const app = createApp();
const JWT_SECRET = process.env.JWT_SECRET!;

/**
 * Parcels route tests (Task 8.2)
 *
 * Scenarios covered:
 * - CRUD success (list, retrieve, create, update, delete)
 * - Missing auth → 401
 * - Other-user access → 404
 * - Validation errors → 400
 * - Search/filter with query params
 */

function tokenFor(userId: number, email: string): string {
  return jwt.sign({ id: userId, email, role: "admin" }, JWT_SECRET, { expiresIn: "7d" });
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
      table.integer("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
      table.text("name").notNullable();
      table.float("area").notNullable();
      table.text("location").notNullable();
      table.text("soil_type").notNullable();
      table.text("created_at").notNullable().defaultTo(db.fn.now());
      table.text("updated_at").notNullable().defaultTo(db.fn.now());
    });
  }
});

beforeEach(async () => {
  await db("parcels").del();
  await db("users").del();
});

// ── Auth guard ──────────────────────────────────────────────────────────

describe("Authentication guard", () => {
  it("returns 401 when no Authorization header is present", async () => {
    const res = await request(app).get("/api/parcels");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Authentication required");
  });

  it("returns 401 when token is missing Bearer prefix", async () => {
    const tok = jwt.sign({ id: 1, email: "x@t.com" }, JWT_SECRET);
    const res = await request(app)
      .get("/api/parcels")
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
      .get("/api/parcels")
      .set("Authorization", `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });
});

// ── CRUD operations (user-scoped) ──────────────────────────────────────

describe("POST /api/parcels — create", () => {
  let userId: number;
  let userEmail: string;

  beforeEach(async () => {
    [userId, userEmail] = await insertUser("u1@test.com");
  });

  it("creates a parcel and returns 201", async () => {
    const res = await request(app)
      .post("/api/parcels")
      .set("Authorization", authHeader(userId, userEmail))
      .send({
        name: "Lote Norte",
        area: 5.5,
        location: "Zona norte",
        soil_type: "arcilloso",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.name).toBe("Lote Norte");
    expect(res.body.area).toBe(5.5);
    expect(res.body.user_id).toBe(userId);
    expect(res.body).toHaveProperty("created_at");
  });

  it("returns 400 when name is empty", async () => {
    const res = await request(app)
      .post("/api/parcels")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ name: "", area: 5, location: "Zona", soil_type: "arcilloso" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Name is required");
  });

  it("returns 400 when area is zero or negative", async () => {
    const res = await request(app)
      .post("/api/parcels")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ name: "Lote", area: 0, location: "Zona", soil_type: "arcilloso" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Area must be greater than 0");
  });

  it("returns 400 when location is empty", async () => {
    const res = await request(app)
      .post("/api/parcels")
      .set("Authorization", authHeader(userId, userEmail))
      .send({ name: "Lote", area: 5, location: "", soil_type: "arcilloso" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Location is required");
  });
});

// ── List parcels ────────────────────────────────────────────────────────

describe("GET /api/parcels — list", () => {
  let userId: number;
  let userEmail: string;

  beforeEach(async () => {
    [userId, userEmail] = await insertUser("u1@test.com");
  });

  it("returns empty array when user has no parcels", async () => {
    const res = await request(app)
      .get("/api/parcels")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns all parcels for the authenticated user", async () => {
    await insertParcel(userId, { name: "Norte", area: 10, location: "Zona A", soil_type: "arcilloso" });
    await insertParcel(userId, { name: "Sur", area: 20, location: "Zona B", soil_type: "franco" });

    const res = await request(app)
      .get("/api/parcels")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it("only returns parcels for the authenticated user (not others)", async () => {
    const [user2Id] = await insertUser("u2@test.com");

    await insertParcel(userId, { name: "User1 Parcel" });
    await insertParcel(user2Id, { name: "User2 Parcel" });

    const res = await request(app)
      .get("/api/parcels")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe("User1 Parcel");
  });

  it("filters by search param (case-insensitive by name)", async () => {
    await insertParcel(userId, { name: "Norte", area: 10, location: "A", soil_type: "arcilloso" });
    await insertParcel(userId, { name: "Sur", area: 20, location: "B", soil_type: "franco" });
    await insertParcel(userId, { name: "Este", area: 15, location: "C", soil_type: "arenoso" });

    const res = await request(app)
      .get("/api/parcels?search=sur")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe("Sur");
  });

  it("filters by soil_type param", async () => {
    await insertParcel(userId, { name: "L1", area: 10, location: "A", soil_type: "arcilloso" });
    await insertParcel(userId, { name: "L2", area: 20, location: "B", soil_type: "franco" });

    const res = await request(app)
      .get("/api/parcels?soil_type=franco")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].soil_type).toBe("franco");
  });
});

// ── Get single ─────────────────────────────────────────────────────────

describe("GET /api/parcels/:id — get by id", () => {
  let userId: number;
  let userEmail: string;
  let user2Id: number;
  let user2Email: string;
  let parcelId: number;

  beforeEach(async () => {
    [userId, userEmail] = await insertUser("u1@test.com");
    [user2Id, user2Email] = await insertUser("u2@test.com");
    parcelId = await insertParcel(userId, {
      name: "My Parcel",
      area: 12,
      location: "Somewhere",
      soil_type: "arcilloso",
    });
  });

  it("returns the parcel for the owning user", async () => {
    const res = await request(app)
      .get(`/api/parcels/${parcelId}`)
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("My Parcel");
    expect(res.body.id).toBe(parcelId);
  });

  it("returns 404 when another user tries to access", async () => {
    const res = await request(app)
      .get(`/api/parcels/${parcelId}`)
      .set("Authorization", authHeader(user2Id, user2Email));

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Parcel not found");
  });

  it("returns 404 for non-existent parcel id", async () => {
    const res = await request(app)
      .get("/api/parcels/99999")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(404);
  });
});

// ── Update ─────────────────────────────────────────────────────────────

describe("PUT /api/parcels/:id — update", () => {
  let userId: number;
  let userEmail: string;
  let user2Id: number;
  let user2Email: string;
  let parcelId: number;

  beforeEach(async () => {
    [userId, userEmail] = await insertUser("u1@test.com");
    [user2Id, user2Email] = await insertUser("u2@test.com");
    parcelId = await insertParcel(userId, {
      name: "Old Name",
      area: 5,
      location: "A",
      soil_type: "arcilloso",
    });
  });

  it("updates the parcel and returns 200", async () => {
    const res = await request(app)
      .put(`/api/parcels/${parcelId}`)
      .set("Authorization", authHeader(userId, userEmail))
      .send({ name: "New Name", area: 8 });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("New Name");
    expect(res.body.area).toBe(8);
    expect(res.body.updated_at).not.toBeNull();
  });

  it("returns 404 when another user tries to update", async () => {
    const res = await request(app)
      .put(`/api/parcels/${parcelId}`)
      .set("Authorization", authHeader(user2Id, user2Email))
      .send({ name: "Hacked" });

    expect(res.status).toBe(404);
  });

  it("returns 400 when no fields provided", async () => {
    const res = await request(app)
      .put(`/api/parcels/${parcelId}`)
      .set("Authorization", authHeader(userId, userEmail))
      .send({});

    expect(res.status).toBe(400);
  });
});

// ── Delete ─────────────────────────────────────────────────────────────

describe("DELETE /api/parcels/:id — delete", () => {
  let userId: number;
  let userEmail: string;
  let user2Id: number;
  let user2Email: string;
  let parcelId: number;

  beforeEach(async () => {
    [userId, userEmail] = await insertUser("u1@test.com");
    [user2Id, user2Email] = await insertUser("u2@test.com");
    parcelId = await insertParcel(userId, {
      name: "To Delete",
      area: 1,
      location: "X",
      soil_type: "arcilloso",
    });
  });

  it("deletes the parcel and returns 204", async () => {
    const res = await request(app)
      .delete(`/api/parcels/${parcelId}`)
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(204);

    const getRes = await request(app)
      .get(`/api/parcels/${parcelId}`)
      .set("Authorization", authHeader(userId, userEmail));
    expect(getRes.status).toBe(404);
  });

  it("returns 404 when another user tries to delete", async () => {
    const res = await request(app)
      .delete(`/api/parcels/${parcelId}`)
      .set("Authorization", authHeader(user2Id, user2Email));

    expect(res.status).toBe(404);
  });

  it("returns 404 for non-existent id", async () => {
    const res = await request(app)
      .delete("/api/parcels/99999")
      .set("Authorization", authHeader(userId, userEmail));

    expect(res.status).toBe(404);
  });
});
