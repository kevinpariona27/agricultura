import { create } from "zustand";
import type { Irrigation, IrrigationMethod } from "@agri/shared";
import { get, post, put, del } from "../api/client.js";

export interface IrrigationFilters {
  crop_id?: number;
  method?: IrrigationMethod | "";
  date_from?: string;
  date_to?: string;
}

interface IrrigationsState {
  irrigations: Irrigation[];
  current: Irrigation | null;
  loading: boolean;
  error: string | null;
  fetchAll: (filters?: IrrigationFilters) => Promise<void>;
  fetchOne: (id: number) => Promise<void>;
  create: (data: CreateIrrigationData) => Promise<Irrigation>;
  update: (id: number, data: Partial<CreateIrrigationData>) => Promise<Irrigation>;
  remove: (id: number) => Promise<void>;
  clearError: () => void;
}

export interface CreateIrrigationData {
  crop_id: number;
  amount: number;
  irrigation_date: string;
  method: IrrigationMethod;
  duration?: number;
  notes?: string;
}

export const useIrrigationsStore = create<IrrigationsState>((set) => ({
  irrigations: [],
  current: null,
  loading: false,
  error: null,

  fetchAll: async (filters?: IrrigationFilters) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.crop_id) params.set("crop_id", String(filters.crop_id));
      if (filters?.method) params.set("method", filters.method);
      if (filters?.date_from) params.set("date_from", filters.date_from);
      if (filters?.date_to) params.set("date_to", filters.date_to);
      const qs = params.toString();
      const data = await get<Irrigation[]>(`/irrigations${qs ? `?${qs}` : ""}`);
      set({ irrigations: data, loading: false });
    } catch {
      set({ error: "Error al cargar los riegos", loading: false });
    }
  },

  fetchOne: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const data = await get<Irrigation>(`/irrigations/${id}`);
      set({ current: data, loading: false });
    } catch {
      set({ error: "Error al cargar el riego", loading: false });
    }
  },

  create: async (data: CreateIrrigationData) => {
    set({ loading: true, error: null });
    try {
      const irrigation = await post<Irrigation>("/irrigations", data);
      set((state) => ({ irrigations: [irrigation, ...state.irrigations], loading: false }));
      return irrigation;
    } catch {
      set({ error: "Error al crear el riego", loading: false });
      throw new Error("Error al crear el riego");
    }
  },

  update: async (id: number, data: Partial<CreateIrrigationData>) => {
    set({ loading: true, error: null });
    try {
      const irrigation = await put<Irrigation>(`/irrigations/${id}`, data);
      set((state) => ({
        irrigations: state.irrigations.map((i) => (i.id === id ? irrigation : i)),
        current: state.current?.id === id ? irrigation : state.current,
        loading: false,
      }));
      return irrigation;
    } catch {
      set({ error: "Error al actualizar el riego", loading: false });
      throw new Error("Error al actualizar el riego");
    }
  },

  remove: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await del(`/irrigations/${id}`);
      set((state) => ({ irrigations: state.irrigations.filter((i) => i.id !== id), current: state.current?.id === id ? null : state.current, loading: false }));
    } catch {
      set({ error: "Error al eliminar el riego", loading: false });
      throw new Error("Error al eliminar el riego");
    }
  },

  clearError: () => set({ error: null }),
}));
