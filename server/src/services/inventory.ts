import { unlink } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import db from "../db/connection.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadsDir = resolve(__dirname, "..", "..", "uploads");

export interface InventoryRow {
  id: number;
  user_id: number;
  nombre: string;
  categoria: string;
  cantidad: number;
  unidad: string;
  fecha_adquisicion?: string;
  fecha_vencimiento?: string;
  costo_unitario?: number;
  image_url?: string | null;
  notas?: string;
  created_at: string;
  updated_at: string;
}

export type CreateInventoryData = {
  nombre: string;
  categoria: string;
  cantidad: number;
  unidad: string;
  fecha_adquisicion?: string;
  fecha_vencimiento?: string;
  costo_unitario?: number;
  notas?: string;
};

export type UpdateInventoryData = Partial<CreateInventoryData>;

export interface InventoryFilters {
  nombre?: string;
  categoria?: string;
}

export async function listAll(
  userId: number,
  filters?: InventoryFilters
): Promise<InventoryRow[]> {
  let query = db("inventory")
    .where("user_id", userId)
    .select("*");

  if (filters?.categoria) {
    query = query.where("categoria", filters.categoria);
  }

  if (filters?.nombre) {
    query = query.where("nombre", "like", `%${filters.nombre}%`);
  }

  return query.orderBy("created_at", "desc");
}

export async function getById(
  id: number,
  userId: number
): Promise<InventoryRow | undefined> {
  const row = await db("inventory")
    .where("id", id)
    .where("user_id", userId)
    .first();
  return row;
}

export async function create(
  data: CreateInventoryData,
  userId: number
): Promise<InventoryRow> {
  const [id] = await db("inventory").insert({
    ...data,
    user_id: userId,
  });

  return db("inventory").where({ id }).first();
}

export async function update(
  id: number,
  userId: number,
  partial: UpdateInventoryData
): Promise<InventoryRow | undefined> {
  const existing = await db("inventory")
    .where("id", id)
    .where("user_id", userId)
    .select("id")
    .first();

  if (!existing) {
    return undefined;
  }

  await db("inventory")
    .where({ id })
    .update({
      ...partial,
      updated_at: db.fn.now(),
    });

  return db("inventory").where({ id }).first();
}

export async function remove(
  id: number,
  userId: number
): Promise<boolean> {
  const owned = await db("inventory")
    .where("id", id)
    .where("user_id", userId)
    .select("*")
    .first();

  if (!owned) {
    return false;
  }

  // Clean up image file on disk
  if (owned.image_url) {
    const filePath = resolve(uploadsDir, owned.image_url);
    unlink(filePath, (err) => {
      if (err && (err as NodeJS.ErrnoException).code !== "ENOENT") {
        console.error(`Failed to delete image for inventory ${id}:`, err.message);
      }
    });
  }

  const deleted = await db("inventory").where({ id }).del();
  return deleted > 0;
}
