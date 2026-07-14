import { create } from "zustand";
import type { Crop, CropStatus } from "@agri/shared";
import { get, post, put, del, isNetworkError } from "../api/client.js";
import { enqueue } from "../shared/utils/offlineQueue.js";

export interface CropFilters {
  parcel_id?: number;
  status?: CropStatus | "";
  search?: string;
}

interface CropsState {
  crops: Crop[];
  current: Crop | null;
  loading: boolean;
  error: string | null;
  fetchAll: (filters?: CropFilters) => Promise<void>;
  fetchOne: (id: number) => Promise<void>;
  create: (data: CreateCropData) => Promise<Crop>;
  update: (id: number, data: Partial<CreateCropData>) => Promise<Crop>;
  remove: (id: number) => Promise<void>;
  clearError: () => void;
}

export interface CreateCropData {
  parcel_id: number;
  variety: string;
  planting_date: string;
  status: CropStatus;
  estimated_harvest_date?: string;
  planting_density?: number;
  notes?: string;
}

export const useCropsStore = create<CropsState>((set) => ({
  crops: [],
  current: null,
  loading: false,
  error: null,

  fetchAll: async (filters?: CropFilters) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.parcel_id) params.set("parcel_id", String(filters.parcel_id));
      if (filters?.status) params.set("status", filters.status);
      if (filters?.search) params.set("search", filters.search);
      const qs = params.toString();
      const data = await get<Crop[]>(`/crops${qs ? `?${qs}` : ""}`);
      set({ crops: data, loading: false });
    } catch {
      set({ error: "Error al cargar los cultivos", loading: false });
    }
  },

  fetchOne: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const data = await get<Crop>(`/crops/${id}`);
      set({ current: data, loading: false });
    } catch {
      set({ error: "Error al cargar el cultivo", loading: false });
    }
  },

  create: async (data: CreateCropData) => {
    set({ loading: true, error: null });
    try {
      const crop = await post<Crop>("/crops", data);
      set((state) => ({
        crops: [crop, ...state.crops],
        loading: false,
      }));
      return crop;
    } catch (err) {
      if (isNetworkError(err)) {
        enqueue({ method: "POST", url: "/crops", body: data });
        set({ loading: false });
        return { id: -Date.now(), ...data, estimated_harvest_date: data.estimated_harvest_date ?? undefined, planting_density: data.planting_density ?? undefined, notes: data.notes ?? undefined, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as unknown as Crop;
      }
      set({ error: "Error al crear el cultivo", loading: false });
      throw new Error("Error al crear el cultivo");
    }
  },

  update: async (id: number, data: Partial<CreateCropData>) => {
    set({ loading: true, error: null });
    try {
      const crop = await put<Crop>(`/crops/${id}`, data);
      set((state) => ({
        crops: state.crops.map((c) => (c.id === id ? crop : c)),
        current: state.current?.id === id ? crop : state.current,
        loading: false,
      }));
      return crop;
    } catch (err) {
      if (isNetworkError(err)) {
        enqueue({ method: "PUT", url: `/crops/${id}`, body: data });
        set({ loading: false });
        return { id, ...data } as unknown as Crop;
      }
      set({ error: "Error al actualizar el cultivo", loading: false });
      throw new Error("Error al actualizar el cultivo");
    }
  },

  remove: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await del(`/crops/${id}`);
      set((state) => ({
        crops: state.crops.filter((c) => c.id !== id),
        current: state.current?.id === id ? null : state.current,
        loading: false,
      }));
    } catch (err) {
      if (isNetworkError(err)) {
        enqueue({ method: "DELETE", url: `/crops/${id}` });
        set((state) => ({
          crops: state.crops.filter((c) => c.id !== id),
          current: state.current?.id === id ? null : state.current,
          loading: false,
        }));
        return;
      }
      set({ error: "Error al eliminar el cultivo", loading: false });
      throw new Error("Error al eliminar el cultivo");
    }
  },

  clearError: () => set({ error: null }),
}));
