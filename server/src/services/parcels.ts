import db from "../db/connection.js";

interface ParcelRow {
  id: number;
  user_id: number;
  name: string;
  area: number;
  location: string;
  soil_type: string;
  created_at: string;
  updated_at: string;
}

type CreateParcelData = {
  name: string;
  area: number;
  location: string;
  soil_type: string;
};

type UpdateParcelData = Partial<CreateParcelData>;

export async function listAll(
  userId: number,
  search?: string,
  soil_type?: string
): Promise<ParcelRow[]> {
  let query = db("parcels").where({ user_id: userId });

  if (search) {
    query = query.where("name", "like", `%${search}%`);
  }

  if (soil_type) {
    query = query.where({ soil_type });
  }

  const rows = await query.orderBy("created_at", "desc");
  return rows;
}

export async function getById(
  id: number,
  userId: number
): Promise<ParcelRow | undefined> {
  const row = await db("parcels").where({ id, user_id: userId }).first();
  return row;
}

export async function create(
  data: CreateParcelData,
  userId: number
): Promise<ParcelRow> {
  const [id] = await db("parcels").insert({
    ...data,
    user_id: userId,
  });

  const parcel = await db("parcels").where({ id }).first();
  return parcel;
}

export async function update(
  id: number,
  userId: number,
  partial: UpdateParcelData
): Promise<ParcelRow | undefined> {
  const existing = await db("parcels").where({ id, user_id: userId }).first();

  if (!existing) {
    return undefined;
  }

  await db("parcels")
    .where({ id, user_id: userId })
    .update({
      ...partial,
      updated_at: db.fn.now(),
    });

  const parcel = await db("parcels").where({ id }).first();
  return parcel;
}

export async function remove(
  id: number,
  userId: number
): Promise<boolean> {
  const deleted = await db("parcels").where({ id, user_id: userId }).del();
  return deleted > 0;
}
