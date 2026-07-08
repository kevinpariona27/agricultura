import db from "../db/connection.js";

export interface CropRow {
  id: number;
  parcel_id: number;
  variety: string;
  planting_date: string;
  status: string;
  estimated_harvest_date?: string;
  planting_density?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type CreateCropData = {
  parcel_id: number;
  variety: string;
  planting_date: string;
  status: string;
  estimated_harvest_date?: string;
  planting_density?: number;
  notes?: string;
};

export type UpdateCropData = Partial<CreateCropData>;

/**
 * List all crops for a user, scoped via JOIN through parcels.
 * Supports optional parcel_id, status, and variety search filters (AD-12).
 */
export async function listAll(
  userId: number,
  parcel_id?: number,
  status?: string,
  search?: string
): Promise<CropRow[]> {
  let query = db("crops")
    .join("parcels", "crops.parcel_id", "parcels.id")
    .where("parcels.user_id", userId)
    .select("crops.*");

  if (parcel_id) {
    query = query.where("crops.parcel_id", parcel_id);
  }

  if (status) {
    query = query.where("crops.status", status);
  }

  if (search) {
    query = query.where("crops.variety", "like", `%${search}%`);
  }

  const rows = await query.orderBy("crops.created_at", "desc");
  return rows;
}

/**
 * Get a single crop by id, scoped to the authenticated user via JOIN.
 */
export async function getById(
  id: number,
  userId: number
): Promise<CropRow | undefined> {
  const row = await db("crops")
    .join("parcels", "crops.parcel_id", "parcels.id")
    .where("parcels.user_id", userId)
    .where("crops.id", id)
    .select("crops.*")
    .first();
  return row;
}

/**
 * Create a crop. Verifies parcel ownership before inserting (AD-8).
 * Returns undefined if the parcel does not belong to the user.
 */
export async function create(
  data: CreateCropData,
  userId: number
): Promise<CropRow | undefined> {
  // Verify parcel ownership
  const parcel = await db("parcels")
    .where({ id: data.parcel_id, user_id: userId })
    .first();

  if (!parcel) {
    return undefined;
  }

  const [id] = await db("crops").insert(data);

  const crop = await db("crops").where({ id }).first();
  return crop;
}

/**
 * Update a crop. Verifies the crop belongs to the user, and re-validates
 * parcel ownership if parcel_id is being changed (AD-8).
 * Returns undefined if the crop is not found or parcel ownership fails.
 */
export async function update(
  id: number,
  userId: number,
  partial: UpdateCropData
): Promise<CropRow | undefined> {
  // Verify crop exists and belongs to user
  const existing = await getById(id, userId);
  if (!existing) {
    return undefined;
  }

  // If parcel_id is being changed, verify new parcel ownership
  if (partial.parcel_id !== undefined) {
    const newParcel = await db("parcels")
      .where({ id: partial.parcel_id, user_id: userId })
      .first();
    if (!newParcel) {
      return undefined;
    }
  }

  await db("crops")
    .where({ id })
    .update({
      ...partial,
      updated_at: db.fn.now(),
    });

  const crop = await db("crops").where({ id }).first();
  return crop;
}

/**
 * Delete a crop, scoped to the authenticated user via JOIN.
 * Returns true if a row was deleted.
 */
export async function remove(
  id: number,
  userId: number
): Promise<boolean> {
  // Verify ownership via JOIN before deleting
  const owned = await getById(id, userId);
  if (!owned) {
    return false;
  }

  const deleted = await db("crops").where({ id }).del();
  return deleted > 0;
}
