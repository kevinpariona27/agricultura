export interface User {
  id: number;
  email: string;
}

export interface Parcel {
  id: number;
  user_id: number;
  name: string;
  area: number;
  location: string;
  soil_type: string;
  created_at: string;
  updated_at: string;
}

export type CropStatus =
  | "planificado"
  | "en_crecimiento"
  | "floracion"
  | "en_cosecha"
  | "cosechado"
  | "cancelado";

export interface Crop {
  id: number;
  parcel_id: number;
  variety: string;
  planting_date: string;
  status: CropStatus;
  estimated_harvest_date?: string;
  planting_density?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type IrrigationMethod = "aspersion" | "goteo" | "inundacion" | "manual";

export interface Irrigation {
  id: number;
  crop_id: number;
  amount: number;
  irrigation_date: string;
  method: IrrigationMethod;
  duration?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
}


