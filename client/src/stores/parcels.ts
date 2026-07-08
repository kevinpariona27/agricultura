import { create } from "zustand";
import type { Parcel } from "@agri/shared";
import { get, post, put, del } from "../api/client.js";

interface ParcelsState {
  parcels: Parcel[];
  current: Parcel | null;
  loading: boolean;
  error: string | null;
  fetchAll: (search?: string, soil_type?: string) => Promise<void>;
  fetchOne: (id: number) => Promise<void>;
  create: (data: CreateParcelData) => Promise<Parcel>;
  update: (id: number, data: Partial<CreateParcelData>) => Promise<Parcel>;
  remove: (id: number) => Promise<void>;
  clearError: () => void;
}

interface CreateParcelData {
  name: string;
  area: number;
  location: string;
  soil_type: string;
}

export const useParcelsStore = create<ParcelsState>((set) => ({
  parcels: [],
  current: null,
  loading: false,
  error: null,

  fetchAll: async (search?: string, soil_type?: string) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (soil_type) params.set("soil_type", soil_type);
      const qs = params.toString();
      const data = await get<Parcel[]>(`/parcels${qs ? `?${qs}` : ""}`);
      set({ parcels: data, loading: false });
    } catch (err) {
      set({ error: "Error al cargar los lotes", loading: false });
    }
  },

  fetchOne: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const data = await get<Parcel>(`/parcels/${id}`);
      set({ current: data, loading: false });
    } catch (err) {
      set({ error: "Error al cargar el lote", loading: false });
    }
  },

  create: async (data: CreateParcelData) => {
    set({ loading: true, error: null });
    try {
      const parcel = await post<Parcel>("/parcels", data);
      set((state) => ({
        parcels: [parcel, ...state.parcels],
        loading: false,
      }));
      return parcel;
    } catch (err) {
      set({ error: "Error al crear el lote", loading: false });
      throw err;
    }
  },

  update: async (id: number, data: Partial<CreateParcelData>) => {
    set({ loading: true, error: null });
    try {
      const parcel = await put<Parcel>(`/parcels/${id}`, data);
      set((state) => ({
        parcels: state.parcels.map((p) => (p.id === id ? parcel : p)),
        current: state.current?.id === id ? parcel : state.current,
        loading: false,
      }));
      return parcel;
    } catch (err) {
      set({ error: "Error al actualizar el lote", loading: false });
      throw err;
    }
  },

  remove: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await del(`/parcels/${id}`);
      set((state) => ({
        parcels: state.parcels.filter((p) => p.id !== id),
        current: state.current?.id === id ? null : state.current,
        loading: false,
      }));
    } catch (err) {
      set({ error: "Error al eliminar el lote", loading: false });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
