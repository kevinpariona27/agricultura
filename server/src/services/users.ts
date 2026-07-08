import db from "../db/connection.js";

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  nombre?: string | null;
  rol: string;
  created_at: string;
  updated_at?: string | null;
}

export interface UserProfileResponse {
  id: number;
  email: string;
  nombre?: string | null;
  rol: string;
  fecha_registro: string;
  updated_at?: string | null;
}

function toProfile(row: UserRow): UserProfileResponse {
  return {
    id: row.id,
    email: row.email,
    nombre: row.nombre ?? null,
    rol: row.rol ?? "operador",
    fecha_registro: row.created_at,
    updated_at: row.updated_at ?? null,
  };
}

/**
 * Get the authenticated user's profile by ID.
 * Returns undefined if the user doesn't exist.
 */
export async function getProfile(
  userId: number
): Promise<UserProfileResponse | undefined> {
  const user = await db("users").where({ id: userId }).first();
  if (!user) return undefined;
  return toProfile(user);
}

export type UpdateProfileData = {
  nombre?: string;
  rol?: string;
};

/**
 * Update the authenticated user's profile fields (nombre and/or rol).
 * Returns undefined if the user doesn't exist.
 */
export async function updateProfile(
  userId: number,
  data: UpdateProfileData
): Promise<UserProfileResponse | undefined> {
  const existing = await db("users").where({ id: userId }).first();
  if (!existing) return undefined;

  const updateFields: Record<string, unknown> = {};
  if (data.nombre !== undefined) updateFields.nombre = data.nombre || null;
  if (data.rol !== undefined) updateFields.rol = data.rol;
  updateFields.updated_at = db.fn.now();

  await db("users").where({ id: userId }).update(updateFields);

  const updated = await db("users").where({ id: userId }).first();
  return toProfile(updated);
}
