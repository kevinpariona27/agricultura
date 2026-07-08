import { create } from "zustand";
import type { Harvest, HarvestUnit } from "@agri/shared";
import { get, post, put, del } from "../api/client";

export interface HarvestFilters {
  crop_id?: number;
  date_from?: string;
  date_to?: string;
}

export interface CreateHarvestData {
  crop_id: number;
  cantidad: number;
  unidad: HarvestUnit;
  fecha_cosecha: string;
  rendimiento?: number;
  perdidas?: number;
  notas?: string;
}

interface HarvestsState {
  harvests: Harvest[];
  current: Harvest | null;
  loading: boolean;
  error: string | null;
  fetchAll: (filters?: HarvestFilters) => Promise<void>;
  fetchOne: (id: number) => Promise<void>;
  create: (data: CreateHarvestData) => Promise<Harvest>;
  update: (id: number, data: Partial<CreateHarvestData>) => Promise<Harvest>;
  remove: (id: number) => Promise<void>;
  clearError: () => void;
}

export const useHarvestsStore = create<HarvestsState>((set) => ({
  harvests: [],
  current: null,
  loading: false,
  error: null,

  fetchAll: async (filters?: HarvestFilters) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.crop_id) params.set("crop_id", String(filters.crop_id));
      if (filters?.date_from) params.set("date_from", filters.date_from);
      if (filters?.date_to) params.set("date_to", filters.date_to);
      const qs = params.toString();
      const data = await get<Harvest[]>(`/harvests${qs ? `?${qs}` : ""}`);
      set({ harvests: data, loading: false });
    } catch {
      set({ error: "Error al cargar las cosechas", loading: false });
    }
  },

  fetchOne: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const data = await get<Harvest>(`/harvests/${id}`);
      set({ current: data, loading: false });
    } catch {
      set({ error: "Error al cargar la cosecha", loading: false });
    }
  },

  create: async (data: CreateHarvestData) => {
    set({ loading: true, error: null });
    try {
      const harvest = await post<Harvest>("/harvests", data);
      set((state) => ({ harvests: [harvest, ...state.harvests], loading: false }));
      return harvest;
    } catch {
      set({ error: "Error al crear la cosecha", loading: false });
      throw new Error("Error al crear la cosecha");
    }
  },

  update: async (id: number, data: Partial<CreateHarvestData>) => {
    set({ loading: true, error: null });
    try {
      const harvest = await put<Harvest>(`/harvests/${id}`, data);
      set((state) => ({
        harvests: state.harvests.map((h) => (h.id === id ? harvest : h)),
        current: state.current?.id === id ? harvest : state.current,
        loading: false,
      }));
      return harvest;
    } catch {
      set({ error: "Error al actualizar la cosecha", loading: false });
      throw new Error("Error al actualizar la cosecha");
    }
  },

  remove: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await del(`/harvests/${id}`);
      set((state) => ({ harvests: state.harvests.filter((h) => h.id !== id), current: state.current?.id === id ? null : state.current, loading: false }));
    } catch {
      set({ error: "Error al eliminar la cosecha", loading: false });
      throw new Error("Error al eliminar la cosecha");
    }
  },

  clearError: () => set({ error: null }),
}));
