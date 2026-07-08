import db from "../db/connection.js";

export interface PestRow {
  id: number;
  crop_id: number;
  tipo: string;
  nombre: string;
  severidad: string;
  fecha_deteccion: string;
  tratamiento?: string;
  estado: string;
  notas?: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export type CreatePestData = {
  crop_id: number;
  tipo: string;
  nombre: string;
  severidad: string;
  fecha_deteccion: string;
  estado: string;
  tratamiento?: string;
  notas?: string;
};

export type UpdatePestData = Partial<CreatePestData>;

export interface PestFilters {
  nombre?: string;
  tipo?: string;
  estado?: string;
}

export async function listAll(
  userId: number,
  filters?: PestFilters
): Promise<PestRow[]> {
  let query = db("pests")
    .join("crops", "pests.crop_id", "crops.id")
    .join("parcels", "crops.parcel_id", "parcels.id")
    .where("parcels.user_id", userId)
    .select("pests.*");

  if (filters?.tipo) {
    query = query.where("pests.tipo", filters.tipo);
  }

  if (filters?.estado) {
    query = query.where("pests.estado", filters.estado);
  }

  if (filters?.nombre) {
    query = query.where("pests.nombre", "like", `%${filters.nombre}%`);
  }

  return query.orderBy("pests.created_at", "desc");
}

export async function getById(
  id: number,
  userId: number
): Promise<(PestRow & { crop_name: string }) | undefined> {
  const row = await db("pests")
    .join("crops", "pests.crop_id", "crops.id")
    .join("parcels", "crops.parcel_id", "parcels.id")
    .where("parcels.user_id", userId)
    .where("pests.id", id)
    .select("pests.*", "crops.variety as crop_name")
    .first();
  return row;
}

export async function create(
  data: CreatePestData,
  userId: number
): Promise<PestRow | undefined> {
  const crop = await db("crops")
    .join("parcels", "crops.parcel_id", "parcels.id")
    .where("crops.id", data.crop_id)
    .where("parcels.user_id", userId)
    .select("crops.id")
    .first();

  if (!crop) {
    return undefined;
  }

  const [id] = await db("pests").insert({
    ...data,
    user_id: userId,
  });

  return db("pests").where({ id }).first();
}

export async function update(
  id: number,
  userId: number,
  partial: UpdatePestData
): Promise<PestRow | undefined> {
  const existing = await db("pests")
    .join("crops", "pests.crop_id", "crops.id")
    .join("parcels", "crops.parcel_id", "parcels.id")
    .where("parcels.user_id", userId)
    .where("pests.id", id)
    .select("pests.id")
    .first();

  if (!existing) {
    return undefined;
  }

  if (partial.crop_id !== undefined) {
    const newCrop = await db("crops")
      .join("parcels", "crops.parcel_id", "parcels.id")
      .where("crops.id", partial.crop_id)
      .where("parcels.user_id", userId)
      .select("crops.id")
      .first();

    if (!newCrop) {
      return undefined;
    }
  }

  await db("pests")
    .where({ id })
    .update({
      ...partial,
      updated_at: db.fn.now(),
    });

  return db("pests").where({ id }).first();
}

export async function remove(
  id: number,
  userId: number
): Promise<boolean> {
  const owned = await db("pests")
    .join("crops", "pests.crop_id", "crops.id")
    .join("parcels", "crops.parcel_id", "parcels.id")
    .where("parcels.user_id", userId)
    .where("pests.id", id)
    .select("pests.id")
    .first();

  if (!owned) {
    return false;
  }

  const deleted = await db("pests").where({ id }).del();
  return deleted > 0;
}
