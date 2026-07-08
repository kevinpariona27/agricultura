import db from "../db/connection.js";

export interface FertilizationRow {
  id: number;
  crop_id: number;
  producto: string;
  dosis: number;
  unidad: string;
  fecha_aplicacion: string;
  notas?: string;
  costo?: number;
  created_at: string;
  updated_at: string;
}

export type CreateFertilizationData = {
  crop_id: number;
  producto: string;
  dosis: number;
  unidad: string;
  fecha_aplicacion: string;
  notas?: string;
  costo?: number;
};

export type UpdateFertilizationData = Partial<CreateFertilizationData>;

/**
 * Verify that a crop belongs to the authenticated user via double-JOIN chain
 * (crops → parcels → users).
 */
async function verifyCropOwnership(
  cropId: number,
  userId: number
): Promise<boolean> {
  const crop = await db("crops")
    .join("parcels", "crops.parcel_id", "parcels.id")
    .where("parcels.user_id", userId)
    .where("crops.id", cropId)
    .select("crops.id")
    .first();
  return !!crop;
}

/**
 * List all fertilizations for a user, scoped via double JOIN
 * (fertilizations → crops → parcels). Supports optional crop_id filter
 * and search on producto.
 */
export async function listAll(
  userId: number,
  crop_id?: number,
  search?: string
): Promise<FertilizationRow[]> {
  let query = db("fertilizations")
    .join("crops", "fertilizations.crop_id", "crops.id")
    .join("parcels", "crops.parcel_id", "parcels.id")
    .where("parcels.user_id", userId)
    .select("fertilizations.*");

  if (crop_id) {
    query = query.where("fertilizations.crop_id", crop_id);
  }

  if (search) {
    query = query.where("fertilizations.producto", "like", `%${search}%`);
  }

  const rows = await query.orderBy("fertilizations.created_at", "desc");
  return rows;
}

/**
 * Get a single fertilization by id, scoped to the authenticated user
 * via double JOIN (fertilizations → crops → parcels).
 */
export async function getById(
  id: number,
  userId: number
): Promise<FertilizationRow | undefined> {
  const row = await db("fertilizations")
    .join("crops", "fertilizations.crop_id", "crops.id")
    .join("parcels", "crops.parcel_id", "parcels.id")
    .where("parcels.user_id", userId)
    .where("fertilizations.id", id)
    .select("fertilizations.*")
    .first();
  return row;
}

/**
 * Create a fertilization. Verifies crop ownership via double JOIN
 * before inserting. Returns undefined if the crop does not belong
 * to the user.
 */
export async function create(
  data: CreateFertilizationData,
  userId: number
): Promise<FertilizationRow | undefined> {
  // Verify crop ownership
  const owned = await verifyCropOwnership(data.crop_id, userId);
  if (!owned) {
    return undefined;
  }

  const [id] = await db("fertilizations").insert(data);

  const fertilization = await db("fertilizations").where({ id }).first();
  return fertilization;
}

/**
 * Update a fertilization. Verifies ownership via getById, and
 * re-verifies crop ownership if crop_id is being changed.
 * Returns undefined if the fertilization is not found or crop
 * ownership fails.
 */
export async function update(
  id: number,
  userId: number,
  partial: UpdateFertilizationData
): Promise<FertilizationRow | undefined> {
  // Verify fertilization exists and belongs to user
  const existing = await getById(id, userId);
  if (!existing) {
    return undefined;
  }

  // If crop_id is being changed, verify new crop ownership
  if (partial.crop_id !== undefined) {
    const owned = await verifyCropOwnership(partial.crop_id, userId);
    if (!owned) {
      return undefined;
    }
  }

  await db("fertilizations")
    .where({ id })
    .update({
      ...partial,
      updated_at: db.fn.now(),
    });

  const fertilization = await db("fertilizations").where({ id }).first();
  return fertilization;
}

/**
 * Delete a fertilization, scoped to the authenticated user via
 * double JOIN ownership verification.
 * Returns true if a row was deleted.
 */
export async function remove(
  id: number,
  userId: number
): Promise<boolean> {
  // Verify ownership via getById before deleting
  const owned = await getById(id, userId);
  if (!owned) {
    return false;
  }

  const deleted = await db("fertilizations").where({ id }).del();
  return deleted > 0;
}
