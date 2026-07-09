import { create } from "zustand";
import type { Pest } from "@agri/shared";
import { get, post, put, del, uploadFile, removeImage } from "../api/client";

export interface PestFilters {
  crop_id?: number;
  tipo?: string;
  estado?: string;
  search?: string;
}

export interface CreatePestData {
  crop_id: number;
  tipo: string;
  nombre: string;
  severidad: string;
  fecha_deteccion: string;
  estado: string;
  tratamiento?: string;
  notas?: string;
}

interface PestsState {
  pests: Pest[];
  current: Pest | null;
  loading: boolean;
  error: string | null;
  fetchAll: (filters?: PestFilters) => Promise<void>;
  fetchOne: (id: number) => Promise<void>;
  create: (data: CreatePestData) => Promise<Pest>;
  update: (id: number, data: Partial<CreatePestData>) => Promise<Pest>;
  remove: (id: number) => Promise<void>;
  uploadImage: (id: number, file: File) => Promise<Pest>;
  removeImage: (id: number) => Promise<Pest>;
  clearError: () => void;
}

export const usePestsStore = create<PestsState>((set) => ({
  pests: [],
  current: null,
  loading: false,
  error: null,

  fetchAll: async (filters?: PestFilters) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.crop_id) params.set("crop_id", String(filters.crop_id));
      if (filters?.tipo) params.set("tipo", filters.tipo);
      if (filters?.estado) params.set("estado", filters.estado);
      if (filters?.search) params.set("nombre", filters.search);
      const qs = params.toString();
      const data = await get<Pest[]>(`/pests${qs ? `?${qs}` : ""}`);
      set({ pests: data, loading: false });
    } catch {
      set({ error: "Error al cargar las plagas", loading: false });
    }
  },

  fetchOne: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const data = await get<Pest>(`/pests/${id}`);
      set({ current: data, loading: false });
    } catch {
      set({ error: "Error al cargar la plaga", loading: false });
    }
  },

  create: async (data: CreatePestData) => {
    set({ loading: true, error: null });
    try {
      const pest = await post<Pest>("/pests", data);
      set((state) => ({
        pests: [pest, ...state.pests],
        loading: false,
      }));
      return pest;
    } catch {
      set({ error: "Error al crear la plaga", loading: false });
      throw new Error("Error al crear la plaga");
    }
  },

  update: async (id: number, data: Partial<CreatePestData>) => {
    set({ loading: true, error: null });
    try {
      const pest = await put<Pest>(`/pests/${id}`, data);
      set((state) => ({
        pests: state.pests.map((p) => (p.id === id ? pest : p)),
        current: state.current?.id === id ? pest : state.current,
        loading: false,
      }));
      return pest;
    } catch {
      set({ error: "Error al actualizar la plaga", loading: false });
      throw new Error("Error al actualizar la plaga");
    }
  },

  remove: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await del(`/pests/${id}`);
      set((state) => ({
        pests: state.pests.filter((p) => p.id !== id),
        current: state.current?.id === id ? null : state.current,
        loading: false,
      }));
    } catch {
      set({ error: "Error al eliminar la plaga", loading: false });
      throw new Error("Error al eliminar la plaga");
    }
  },

  uploadImage: async (id: number, file: File) => {
    set({ loading: true, error: null });
    try {
      const pest = await uploadFile<Pest>("pests", id, file);
      set((state) => ({
        pests: state.pests.map((p) => (p.id === id ? pest : p)),
        current: state.current?.id === id ? pest : state.current,
        loading: false,
      }));
      return pest;
    } catch {
      set({ error: "Error al subir la imagen de la plaga", loading: false });
      throw new Error("Error al subir la imagen de la plaga");
    }
  },

  removeImage: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const pest = await removeImage<Pest>("pests", id);
      set((state) => ({
        pests: state.pests.map((p) => (p.id === id ? pest : p)),
        current: state.current?.id === id ? pest : state.current,
        loading: false,
      }));
      return pest;
    } catch {
      set({ error: "Error al eliminar la imagen de la plaga", loading: false });
      throw new Error("Error al eliminar la imagen de la plaga");
    }
  },

  clearError: () => set({ error: null }),
}));
