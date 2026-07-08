import { create } from "zustand";
import type { Fertilization, FertilizationUnit } from "@agri/shared";
import { get, post, put, del } from "../api/client";

export interface FertilizationFilters {
  crop_id?: number;
  search?: string;
}

export interface CreateFertilizationData {
  crop_id: number;
  producto: string;
  dosis: number;
  unidad: FertilizationUnit;
  fecha_aplicacion: string;
  costo?: number;
  notas?: string;
}

interface FertilizationsState {
  fertilizations: Fertilization[];
  current: Fertilization | null;
  loading: boolean;
  error: string | null;
  fetchAll: (filters?: FertilizationFilters) => Promise<void>;
  fetchOne: (id: number) => Promise<void>;
  create: (data: CreateFertilizationData) => Promise<Fertilization>;
  update: (
    id: number,
    data: Partial<CreateFertilizationData>
  ) => Promise<Fertilization>;
  remove: (id: number) => Promise<void>;
  clearError: () => void;
}

export const useFertilizationsStore = create<FertilizationsState>((set) => ({
  fertilizations: [],
  current: null,
  loading: false,
  error: null,

  fetchAll: async (filters?: FertilizationFilters) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.crop_id) params.set("crop_id", String(filters.crop_id));
      if (filters?.search) params.set("search", filters.search);
      const qs = params.toString();
      const data = await get<Fertilization[]>(
        `/fertilizations${qs ? `?${qs}` : ""}`
      );
      set({ fertilizations: data, loading: false });
    } catch {
      set({ error: "Error al cargar las fertilizaciones", loading: false });
    }
  },

  fetchOne: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const data = await get<Fertilization>(`/fertilizations/${id}`);
      set({ current: data, loading: false });
    } catch {
      set({ error: "Error al cargar la fertilización", loading: false });
    }
  },

  create: async (data: CreateFertilizationData) => {
    set({ loading: true, error: null });
    try {
      const fert = await post<Fertilization>("/fertilizations", data);
      set((state) => ({
        fertilizations: [fert, ...state.fertilizations],
        loading: false,
      }));
      return fert;
    } catch {
      set({ error: "Error al crear la fertilización", loading: false });
      throw new Error("Error al crear la fertilización");
    }
  },

  update: async (id: number, data: Partial<CreateFertilizationData>) => {
    set({ loading: true, error: null });
    try {
      const fert = await put<Fertilization>(`/fertilizations/${id}`, data);
      set((state) => ({
        fertilizations: state.fertilizations.map((f) =>
          f.id === id ? fert : f
        ),
        current: state.current?.id === id ? fert : state.current,
        loading: false,
      }));
      return fert;
    } catch {
      set({ error: "Error al actualizar la fertilización", loading: false });
      throw new Error("Error al actualizar la fertilización");
    }
  },

  remove: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await del(`/fertilizations/${id}`);
      set((state) => ({
        fertilizations: state.fertilizations.filter((f) => f.id !== id),
        current: state.current?.id === id ? null : state.current,
        loading: false,
      }));
    } catch {
      set({ error: "Error al eliminar la fertilización", loading: false });
      throw new Error("Error al eliminar la fertilización");
    }
  },

  clearError: () => set({ error: null }),
}));
