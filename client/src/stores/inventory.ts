import { create } from "zustand";
import type { Inventory } from "@agri/shared";
import { get, post, put, del, isNetworkError } from "../api/client";
import { enqueue } from "../shared/utils/offlineQueue";

export interface InventoryFilters {
  categoria?: string;
  search?: string;
}

export interface CreateInventoryData {
  nombre: string;
  categoria: string;
  cantidad: number;
  unidad: string;
  fecha_adquisicion?: string;
  fecha_vencimiento?: string;
  costo_unitario?: number;
  notas?: string;
}

interface InventoryState {
  items: Inventory[];
  current: Inventory | null;
  loading: boolean;
  error: string | null;
  fetchAll: (filters?: InventoryFilters) => Promise<void>;
  fetchOne: (id: number) => Promise<void>;
  create: (data: CreateInventoryData) => Promise<Inventory>;
  update: (id: number, data: Partial<CreateInventoryData>) => Promise<Inventory>;
  remove: (id: number) => Promise<void>;
  clearError: () => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  items: [],
  current: null,
  loading: false,
  error: null,

  fetchAll: async (filters?: InventoryFilters) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.categoria) params.set("categoria", filters.categoria);
      if (filters?.search) params.set("nombre", filters.search);
      const qs = params.toString();
      const data = await get<Inventory[]>(`/inventory${qs ? `?${qs}` : ""}`);
      set({ items: data, loading: false });
    } catch {
      set({ error: "Error al cargar el inventario", loading: false });
    }
  },

  fetchOne: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const data = await get<Inventory>(`/inventory/${id}`);
      set({ current: data, loading: false });
    } catch {
      set({ error: "Error al cargar el ítem", loading: false });
    }
  },

  create: async (data: CreateInventoryData) => {
    set({ loading: true, error: null });
    try {
      const item = await post<Inventory>("/inventory", data);
      set((state) => ({
        items: [item, ...state.items],
        loading: false,
      }));
      return item;
    } catch (err) {
      if (isNetworkError(err)) {
        enqueue({ method: "POST", url: "/inventory", body: data });
        set({ loading: false });
        return { id: -Date.now(), ...data, user_id: 0, fecha_adquisicion: data.fecha_adquisicion ?? undefined, fecha_vencimiento: data.fecha_vencimiento ?? undefined, costo_unitario: data.costo_unitario ?? undefined, notas: data.notas ?? undefined, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as unknown as Inventory;
      }
      set({ error: "Error al crear el ítem", loading: false });
      throw new Error("Error al crear el ítem");
    }
  },

  update: async (id: number, data: Partial<CreateInventoryData>) => {
    set({ loading: true, error: null });
    try {
      const item = await put<Inventory>(`/inventory/${id}`, data);
      set((state) => ({
        items: state.items.map((i) => (i.id === id ? item : i)),
        current: state.current?.id === id ? item : state.current,
        loading: false,
      }));
      return item;
    } catch (err) {
      if (isNetworkError(err)) {
        enqueue({ method: "PUT", url: `/inventory/${id}`, body: data });
        set({ loading: false });
        return { id, ...data } as unknown as Inventory;
      }
      set({ error: "Error al actualizar el ítem", loading: false });
      throw new Error("Error al actualizar el ítem");
    }
  },

  remove: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await del(`/inventory/${id}`);
      set((state) => ({
        items: state.items.filter((i) => i.id !== id),
        current: state.current?.id === id ? null : state.current,
        loading: false,
      }));
    } catch (err) {
      if (isNetworkError(err)) {
        enqueue({ method: "DELETE", url: `/inventory/${id}` });
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
          current: state.current?.id === id ? null : state.current,
          loading: false,
        }));
        return;
      }
      set({ error: "Error al eliminar el ítem", loading: false });
      throw new Error("Error al eliminar el ítem");
    }
  },

  clearError: () => set({ error: null }),
}));
