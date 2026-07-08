import db from "../db/connection.js";

export interface HarvestRow {
  id: number;
  crop_id: number;
  cantidad: number;
  unidad: string;
  fecha_cosecha: string;
  rendimiento?: number;
  perdidas?: number;
  notas?: string;
  created_at: string;
  updated_at: string;
}

export type CreateHarvestData = {
  crop_id: number;
  cantidad: number;
  unidad: string;
  fecha_cosecha: string;
  rendimiento?: number;
  perdidas?: number;
  notas?: string;
};

export type UpdateHarvestData = Partial<CreateHarvestData>;

export interface HarvestFilters {
  crop_id?: number;
  date_from?: string;
  date_to?: string;
}

/**
 * Verify that a crop belongs to the authenticated user via two-JOIN chain.
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
 * List all harvests for a user, scoped via two-JOIN
 * (harvests → crops → parcels) with optional filters.
 */
export async function listAll(
  userId: number,
  filters: HarvestFilters = {}
): Promise<HarvestRow[]> {
  let query = db("harvests")
    .join("crops", "harvests.crop_id", "crops.id")
    .join("parcels", "crops.parcel_id", "parcels.id")
    .where("parcels.user_id", userId)
    .select("harvests.*");

  if (filters.crop_id) {
    query = query.where("harvests.crop_id", filters.crop_id);
  }

  if (filters.date_from) {
    query = query.where("harvests.fecha_cosecha", ">=", filters.date_from);
  }

  if (filters.date_to) {
    query = query.where("harvests.fecha_cosecha", "<=", filters.date_to);
  }

  const rows = await query.orderBy("harvests.created_at", "desc");
  return rows;
}

/**
 * Get a single harvest by id, scoped to the authenticated user via two-JOIN.
 */
export async function getById(
  id: number,
  userId: number
): Promise<HarvestRow | undefined> {
  const row = await db("harvests")
    .join("crops", "harvests.crop_id", "crops.id")
    .join("parcels", "crops.parcel_id", "parcels.id")
    .where("parcels.user_id", userId)
    .where("harvests.id", id)
    .select("harvests.*")
    .first();
  return row;
}

/**
 * Create a harvest. Verifies crop ownership via two-JOIN before inserting.
 * Returns undefined if the crop does not belong to the user.
 */
export async function create(
  data: CreateHarvestData,
  userId: number
): Promise<HarvestRow | undefined> {
  const owned = await verifyCropOwnership(data.crop_id, userId);
  if (!owned) {
    return undefined;
  }

  const [id] = await db("harvests").insert(data);

  const harvest = await db("harvests").where({ id }).first();
  return harvest;
}

/**
 * Update a harvest. Verifies ownership, and re-verifies crop ownership
 * if crop_id is being changed.
 * Returns undefined if the harvest is not found or crop ownership fails.
 */
export async function update(
  id: number,
  userId: number,
  partial: UpdateHarvestData
): Promise<HarvestRow | undefined> {
  // Verify harvest exists and belongs to user
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

  await db("harvests")
    .where({ id })
    .update({
      ...partial,
      updated_at: db.fn.now(),
    });

  const harvest = await db("harvests").where({ id }).first();
  return harvest;
}

/**
 * Delete a harvest, scoped to the authenticated user via two-JOIN.
 * Returns true if a row was deleted.
 */
export async function remove(
  id: number,
  userId: number
): Promise<boolean> {
  const owned = await getById(id, userId);
  if (!owned) {
    return false;
  }

  const deleted = await db("harvests").where({ id }).del();
  return deleted > 0;
}
