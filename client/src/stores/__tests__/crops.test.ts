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
import { useCropsStore } from "../crops.js";

const sampleCrop = {
  id: 1,
  parcel_id: 1,
  variety: "Maíz Tempranero",
  planting_date: "2026-03-15",
  status: "en_crecimiento" as const,
  estimated_harvest_date: "2026-08-01",
  planting_density: 75000,
  notes: "Variedad resistente a sequía",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

const sampleCrops = [
  sampleCrop,
  {
    ...sampleCrop,
    id: 2,
    variety: "Soja RR",
    status: "planificado" as const,
    planting_date: "2026-10-01",
    notes: undefined,
  },
];

beforeEach(() => {
  useCropsStore.setState({
    crops: [],
    current: null,
    loading: false,
    error: null,
  });
});

describe("Crops store", () => {
  describe("fetchAll", () => {
    it("populates crops array and clears error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => sampleCrops,
      });

      const store = useCropsStore.getState();
      await store.fetchAll();

      const state = useCropsStore.getState();
      expect(state.crops).toHaveLength(2);
      expect(state.crops[0].variety).toBe("Maíz Tempranero");
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("passes filters as query params", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const store = useCropsStore.getState();
      await store.fetchAll({
        parcel_id: 1,
        status: "en_crecimiento",
        search: "Maíz",
      });

      const calls = mockFetch.mock.calls[0] as [string, RequestInit];
      const url = calls[0];
      expect(url).toContain("parcel_id=1");
      expect(url).toContain("status=en_crecimiento");
      expect(url).toContain("search=Ma%C3%ADz");
    });

    it("sets error state on fetch failure", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const store = useCropsStore.getState();
      await store.fetchAll();

      const state = useCropsStore.getState();
      expect(state.error).toBe("Error al cargar los cultivos");
      expect(state.loading).toBe(false);
    });
  });

  describe("fetchOne", () => {
    it("sets current crop", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => sampleCrop,
      });

      const store = useCropsStore.getState();
      await store.fetchOne(1);

      const state = useCropsStore.getState();
      expect(state.current).not.toBeNull();
      expect(state.current?.variety).toBe("Maíz Tempranero");
      expect(state.loading).toBe(false);
    });
  });

  describe("create", () => {
    it("appends new crop to the array", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          ...sampleCrop,
          id: 3,
          variety: "Trigo INTA",
        }),
      });

      const store = useCropsStore.getState();
      const result = await store.create({
        parcel_id: 1,
        variety: "Trigo INTA",
        planting_date: "2026-06-01",
        status: "planificado",
      });

      expect(result.variety).toBe("Trigo INTA");

      const state = useCropsStore.getState();
      expect(state.crops).toHaveLength(1);
      expect(state.crops[0].variety).toBe("Trigo INTA");
      expect(state.loading).toBe(false);
    });
  });

  describe("update", () => {
    it("replaces crop in array and updates current", async () => {
      useCropsStore.setState({ crops: [sampleCrop], current: sampleCrop });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...sampleCrop,
          variety: "Maíz Tardío",
          status: "cosechado" as const,
        }),
      });

      const store = useCropsStore.getState();
      const result = await store.update(1, {
        variety: "Maíz Tardío",
        status: "cosechado",
      });

      expect(result.variety).toBe("Maíz Tardío");

      const state = useCropsStore.getState();
      expect(state.crops[0].variety).toBe("Maíz Tardío");
      expect(state.crops[0].status).toBe("cosechado");
      expect(state.current?.variety).toBe("Maíz Tardío");
    });
  });

  describe("remove", () => {
    it("removes crop from array and clears current", async () => {
      useCropsStore.setState({
        crops: sampleCrops,
        current: sampleCrop,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      });

      const store = useCropsStore.getState();
      await store.remove(1);

      const state = useCropsStore.getState();
      expect(state.crops).toHaveLength(1);
      expect(state.crops[0].id).toBe(2);
      expect(state.current).toBeNull();
    });
  });

  describe("clearError", () => {
    it("clears the error state", () => {
      useCropsStore.setState({ error: "some error" });
      const store = useCropsStore.getState();
      store.clearError();
      expect(useCropsStore.getState().error).toBeNull();
    });
  });
});
