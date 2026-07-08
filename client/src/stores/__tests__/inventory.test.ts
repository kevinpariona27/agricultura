import { describe, it, expect, beforeEach, vi } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn(),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

beforeEach(() => {
  mockFetch.mockReset();
  localStorageMock.setItem("token", "test-token");
});

// Dynamic import after mock setup
import { useInventoryStore } from "../inventory";

const sampleItem = {
  id: 1,
  user_id: 1,
  nombre: "Fertilizante NPK",
  categoria: "fertilizante" as const,
  cantidad: 50,
  unidad: "kg" as const,
  fecha_adquisicion: "2026-06-01",
  fecha_vencimiento: "2027-06-01",
  costo_unitario: 120.5,
  notas: "Aplicar en primavera",
  created_at: "2026-07-01T00:00:00.000Z",
  updated_at: "2026-07-01T00:00:00.000Z",
};

const sampleItems = [
  sampleItem,
  {
    ...sampleItem,
    id: 2,
    nombre: "Semilla de maíz",
    categoria: "semilla" as const,
    cantidad: 100,
    unidad: "bolsa" as const,
    costo_unitario: undefined,
    notas: undefined,
  },
];

beforeEach(() => {
  useInventoryStore.setState({
    items: [],
    current: null,
    loading: false,
    error: null,
  });
});

describe("Inventory store", () => {
  describe("fetchAll", () => {
    it("populates items array and clears error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => sampleItems,
      });

      const store = useInventoryStore.getState();
      await store.fetchAll();

      const state = useInventoryStore.getState();
      expect(state.items).toHaveLength(2);
      expect(state.items[0].nombre).toBe("Fertilizante NPK");
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("passes filters as query params", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const store = useInventoryStore.getState();
      await store.fetchAll({
        categoria: "fertilizante",
        search: "NPK",
      });

      const calls = mockFetch.mock.calls[0] as [string, RequestInit];
      const url = calls[0];
      expect(url).toContain("categoria=fertilizante");
      expect(url).toContain("nombre=NPK");
    });

    it("sets error state on fetch failure", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const store = useInventoryStore.getState();
      await store.fetchAll();

      const state = useInventoryStore.getState();
      expect(state.error).toBe("Error al cargar el inventario");
      expect(state.loading).toBe(false);
    });
  });

  describe("fetchOne", () => {
    it("sets current item", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => sampleItem,
      });

      const store = useInventoryStore.getState();
      await store.fetchOne(1);

      const state = useInventoryStore.getState();
      expect(state.current).not.toBeNull();
      expect(state.current?.nombre).toBe("Fertilizante NPK");
      expect(state.loading).toBe(false);
    });
  });

  describe("create", () => {
    it("prepends new item to the array", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          ...sampleItem,
          id: 3,
          nombre: "Pesticida X",
        }),
      });

      const store = useInventoryStore.getState();
      const result = await store.create({
        nombre: "Pesticida X",
        categoria: "pesticida",
        cantidad: 10,
        unidad: "L",
      });

      expect(result.nombre).toBe("Pesticida X");

      const state = useInventoryStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].nombre).toBe("Pesticida X");
      expect(state.loading).toBe(false);
    });
  });

  describe("update", () => {
    it("replaces item in array and updates current", async () => {
      useInventoryStore.setState({ items: [sampleItem], current: sampleItem });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...sampleItem,
          cantidad: 75,
          costo_unitario: 130,
        }),
      });

      const store = useInventoryStore.getState();
      const result = await store.update(1, {
        cantidad: 75,
        costo_unitario: 130,
      });

      expect(result.cantidad).toBe(75);

      const state = useInventoryStore.getState();
      expect(state.items[0].cantidad).toBe(75);
      expect(state.current?.cantidad).toBe(75);
    });
  });

  describe("remove", () => {
    it("removes item from array and clears current", async () => {
      useInventoryStore.setState({
        items: sampleItems,
        current: sampleItem,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      });

      const store = useInventoryStore.getState();
      await store.remove(1);

      const state = useInventoryStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].id).toBe(2);
      expect(state.current).toBeNull();
    });
  });

  describe("clearError", () => {
    it("clears the error state", () => {
      useInventoryStore.setState({ error: "some error" });
      const store = useInventoryStore.getState();
      store.clearError();
      expect(useInventoryStore.getState().error).toBeNull();
    });
  });
});
