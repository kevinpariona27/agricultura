import db from "../db/connection.js";

export interface IrrigationRow {
  id: number;
  crop_id: number;
  amount: number;
  irrigation_date: string;
  method: string;
  duration?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type CreateIrrigationData = {
  crop_id: number;
  amount: number;
  irrigation_date: string;
  method: string;
  duration?: number;
  notes?: string;
};

export type UpdateIrrigationData = Partial<CreateIrrigationData>;

export interface IrrigationFilters {
  crop_id?: number;
  method?: string;
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
 * List all irrigations for a user, scoped via two-JOIN
 * (irrigations → crops → parcels) with optional filters (AD-14, AD-15).
 */
export async function listAll(
  userId: number,
  filters: IrrigationFilters = {}
): Promise<IrrigationRow[]> {
  let query = db("irrigations")
    .join("crops", "irrigations.crop_id", "crops.id")
    .join("parcels", "crops.parcel_id", "parcels.id")
    .where("parcels.user_id", userId)
    .select("irrigations.*");

  if (filters.crop_id) {
    query = query.where("irrigations.crop_id", filters.crop_id);
  }

  if (filters.method) {
    query = query.where("irrigations.method", filters.method);
  }

  if (filters.date_from) {
    query = query.where("irrigations.irrigation_date", ">=", filters.date_from);
  }

  if (filters.date_to) {
    query = query.where("irrigations.irrigation_date", "<=", filters.date_to);
  }

  const rows = await query.orderBy("irrigations.created_at", "desc");
  return rows;
}

/**
 * Get a single irrigation by id, scoped to the authenticated user via two-JOIN.
 */
export async function getById(
  id: number,
  userId: number
): Promise<IrrigationRow | undefined> {
  const row = await db("irrigations")
    .join("crops", "irrigations.crop_id", "crops.id")
    .join("parcels", "crops.parcel_id", "parcels.id")
    .where("parcels.user_id", userId)
    .where("irrigations.id", id)
    .select("irrigations.*")
    .first();
  return row;
}

/**
 * Create an irrigation. Verifies crop ownership via two-JOIN before inserting (AD-16).
 * Returns undefined if the crop does not belong to the user.
 */
export async function create(
  data: CreateIrrigationData,
  userId: number
): Promise<IrrigationRow | undefined> {
  const owned = await verifyCropOwnership(data.crop_id, userId);
  if (!owned) {
    return undefined;
  }

  const [id] = await db("irrigations").insert(data);

  const irrigation = await db("irrigations").where({ id }).first();
  return irrigation;
}

/**
 * Update an irrigation. Verifies ownership, and re-verifies crop ownership
 * if crop_id is being changed (AD-16).
 * Returns undefined if the irrigation is not found or crop ownership fails.
 */
export async function update(
  id: number,
  userId: number,
  partial: UpdateIrrigationData
): Promise<IrrigationRow | undefined> {
  // Verify irrigation exists and belongs to user
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

  await db("irrigations")
    .where({ id })
    .update({
      ...partial,
      updated_at: db.fn.now(),
    });

  const irrigation = await db("irrigations").where({ id }).first();
  return irrigation;
}

/**
 * Delete an irrigation, scoped to the authenticated user via two-JOIN.
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

  const deleted = await db("irrigations").where({ id }).del();
  return deleted > 0;
}
