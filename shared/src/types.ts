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

export type FertilizationUnit = "kg/ha" | "L/ha";

export interface Fertilization {
  id: number;
  crop_id: number;
  producto: string;
  dosis: number;
  unidad: FertilizationUnit;
  fecha_aplicacion: string;
  notas?: string;
  costo?: number;
  created_at: string;
  updated_at: string;
}

export type PestType = "plaga" | "enfermedad";

export type PestSeverity = "baja" | "media" | "alta";

export type PestStatus = "activo" | "controlado" | "erradicado";

export interface Pest {
  id: number;
  crop_id: number;
  tipo: PestType;
  nombre: string;
  severidad: PestSeverity;
  fecha_deteccion: string;
  tratamiento?: string;
  estado: PestStatus;
  notas?: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePestDTO {
  crop_id: number;
  tipo: PestType;
  nombre: string;
  severidad: PestSeverity;
  fecha_deteccion: string;
  estado: PestStatus;
  tratamiento?: string;
  notas?: string;
}

export type UpdatePestDTO = Partial<CreatePestDTO>;

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


