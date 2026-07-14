export interface User { id: number; email: string; role?: string; }
export type UserRole = "admin" | "manager" | "operator";
export interface UserProfile {
  id: number;
  email: string;
  nombre?: string | null;
  role: UserRole;
  avatar_url?: string | null;
  fecha_registro: string;
  updated_at?: string | null;
}
export interface UpdateProfilePayload { nombre?: string; role?: UserRole; }

/** Audit fields (available on entities when joined with users) */
export interface AuditInfo {
  created_by?: number | null;
  created_by_email?: string | null;
  updated_by?: number | null;
  updated_by_email?: string | null;
}
export interface Parcel { id: number; user_id: number; name: string; area: number; location: string; soil_type: string; image_url?: string | null; created_at: string; updated_at: string; }

export type CropStatus = "planificado" | "en_crecimiento" | "floracion" | "en_cosecha" | "cosechado" | "cancelado";
export interface Crop { id: number; parcel_id: number; variety: string; planting_date: string; status: CropStatus; estimated_harvest_date?: string; planting_density?: number; notes?: string; created_at: string; updated_at: string; }

export type IrrigationMethod = "aspersion" | "goteo" | "inundacion" | "manual";
export interface Irrigation { id: number; crop_id: number; amount: number; irrigation_date: string; method: IrrigationMethod; duration?: number; notes?: string; created_at: string; updated_at: string; }

export type FertilizationUnit = "kg/ha" | "L/ha";
export interface Fertilization { id: number; crop_id: number; producto: string; dosis: number; unidad: FertilizationUnit; fecha_aplicacion: string; notas?: string; costo?: number; created_at: string; updated_at: string; }

export type PestType = "plaga" | "enfermedad";
export type PestSeverity = "baja" | "media" | "alta";
export type PestStatus = "activo" | "controlado" | "erradicado";
export interface Pest { id: number; crop_id: number; tipo: PestType; nombre: string; severidad: PestSeverity; fecha_deteccion: string; tratamiento?: string; estado: PestStatus; notas?: string; image_url?: string | null; created_at: string; updated_at: string; }

export type HarvestUnit = "kg" | "ton";
export interface Harvest { id: number; crop_id: number; cantidad: number; unidad: HarvestUnit; fecha_cosecha: string; rendimiento?: number; perdidas?: number; notas?: string; created_at: string; updated_at: string; }

export type InventoryCategory = "fertilizante" | "pesticida" | "semilla" | "herramienta" | "otro";
export type InventoryUnit = "kg" | "L" | "unidad" | "bolsa";
export interface Inventory { id: number; user_id: number; nombre: string; categoria: InventoryCategory; cantidad: number; unidad: InventoryUnit; fecha_adquisicion?: string; fecha_vencimiento?: string; costo_unitario?: number; notas?: string; created_at: string; updated_at: string; }

export interface ApiResponse<T> { data?: T; error?: string; }
export interface LoginPayload { email: string; password: string; }
export interface RegisterPayload { email: string; password: string; }
