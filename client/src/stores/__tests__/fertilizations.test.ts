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
import { useFertilizationsStore } from "../fertilizations";

const sampleFert: import("@agri/shared").Fertilization = {
  id: 1,
  crop_id: 1,
  producto: "Urea",
  dosis: 150,
  unidad: "kg/ha",
  fecha_aplicacion: "2026-03-15",
  costo: 25000,
  notas: "Aplicación temprana",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

const sampleFerts = [
  sampleFert,
  {
    ...sampleFert,
    id: 2,
    producto: "Fosfato diamónico",
    dosis: 100,
    unidad: "kg/ha" as const,
  },
];

beforeEach(() => {
  useFertilizationsStore.setState({
    fertilizations: [],
    current: null,
    loading: false,
    error: null,
  });
});

describe("Fertilizations store", () => {
  describe("fetchAll", () => {
    it("populates fertilizations array and clears error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => sampleFerts,
      });

      const store = useFertilizationsStore.getState();
      await store.fetchAll();

      const state = useFertilizationsStore.getState();
      expect(state.fertilizations).toHaveLength(2);
      expect(state.fertilizations[0].producto).toBe("Urea");
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("passes filters as query params", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const store = useFertilizationsStore.getState();
      await store.fetchAll({
        crop_id: 1,
        search: "Urea",
      });

      const calls = mockFetch.mock.calls[0] as [string, RequestInit];
      const url = calls[0];
      expect(url).toContain("crop_id=1");
      expect(url).toContain("search=Urea");
    });

    it("sets error state on fetch failure", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const store = useFertilizationsStore.getState();
      await store.fetchAll();

      const state = useFertilizationsStore.getState();
      expect(state.error).toBe("Error al cargar las fertilizaciones");
      expect(state.loading).toBe(false);
    });
  });

  describe("fetchOne", () => {
    it("sets current fertilization", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => sampleFert,
      });

      const store = useFertilizationsStore.getState();
      await store.fetchOne(1);

      const state = useFertilizationsStore.getState();
      expect(state.current).not.toBeNull();
      expect(state.current?.producto).toBe("Urea");
      expect(state.loading).toBe(false);
    });
  });

  describe("create", () => {
    it("appends new fertilization to the array", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          ...sampleFert,
          id: 3,
          producto: "Nitrato de amonio",
        }),
      });

      const store = useFertilizationsStore.getState();
      const result = await store.create({
        crop_id: 1,
        producto: "Nitrato de amonio",
        dosis: 200,
        unidad: "kg/ha",
        fecha_aplicacion: "2026-04-01",
      });

      expect(result.producto).toBe("Nitrato de amonio");

      const state = useFertilizationsStore.getState();
      expect(state.fertilizations).toHaveLength(1);
      expect(state.fertilizations[0].producto).toBe("Nitrato de amonio");
      expect(state.loading).toBe(false);
    });
  });

  describe("update", () => {
    it("replaces fertilization in array and updates current", async () => {
      useFertilizationsStore.setState({
        fertilizations: [sampleFert],
        current: sampleFert,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...sampleFert,
          producto: "Urea granulada",
          dosis: 180,
        }),
      });

      const store = useFertilizationsStore.getState();
      const result = await store.update(1, {
        producto: "Urea granulada",
        dosis: 180,
      });

      expect(result.producto).toBe("Urea granulada");

      const state = useFertilizationsStore.getState();
      expect(state.fertilizations[0].producto).toBe("Urea granulada");
      expect(state.fertilizations[0].dosis).toBe(180);
      expect(state.current?.producto).toBe("Urea granulada");
    });
  });

  describe("remove", () => {
    it("removes fertilization from array and clears current", async () => {
      useFertilizationsStore.setState({
        fertilizations: sampleFerts,
        current: sampleFert,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      });

      const store = useFertilizationsStore.getState();
      await store.remove(1);

      const state = useFertilizationsStore.getState();
      expect(state.fertilizations).toHaveLength(1);
      expect(state.fertilizations[0].id).toBe(2);
      expect(state.current).toBeNull();
    });
  });

  describe("clearError", () => {
    it("clears the error state", () => {
      useFertilizationsStore.setState({ error: "some error" });
      const store = useFertilizationsStore.getState();
      store.clearError();
      expect(useFertilizationsStore.getState().error).toBeNull();
    });
  });
});
