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
import { useParcelsStore } from "../parcels.js";

const sampleParcel = {
  id: 1,
  user_id: 1,
  name: "Lote Norte",
  area: 5.5,
  location: "Zona norte",
  soil_type: "arcilloso",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

const sampleParcels = [
  sampleParcel,
  {
    ...sampleParcel,
    id: 2,
    name: "Lote Sur",
    soil_type: "franco",
  },
];

beforeEach(() => {
  useParcelsStore.setState({
    parcels: [],
    current: null,
    loading: false,
    error: null,
  });
});

describe("Parcels store", () => {
  describe("fetchAll", () => {
    it("loads parcels and updates state", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => sampleParcels,
      });

      const store = useParcelsStore.getState();
      await store.fetchAll();

      const state = useParcelsStore.getState();
      expect(state.parcels).toHaveLength(2);
      expect(state.parcels[0].name).toBe("Lote Norte");
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("passes search and soil_type as query params", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const store = useParcelsStore.getState();
      await store.fetchAll("Norte", "arcilloso");

      // Verify fetch URL includes params
      const calls = mockFetch.mock.calls[0] as [string, RequestInit];
      const url = calls[0];
      expect(url).toContain("search=Norte");
      expect(url).toContain("soil_type=arcilloso");
    });

    it("sets error state on fetch failure", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const store = useParcelsStore.getState();
      await store.fetchAll();

      const state = useParcelsStore.getState();
      expect(state.error).toBe("Error al cargar los lotes");
      expect(state.loading).toBe(false);
    });
  });

  describe("create", () => {
    it("creates a parcel and adds it to the list", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ ...sampleParcel, id: 3, name: "Lote Nuevo" }),
      });

      const store = useParcelsStore.getState();
      const result = await store.create({
        name: "Lote Nuevo",
        area: 10,
        location: "Zona sur",
        soil_type: "franco",
      });

      expect(result.name).toBe("Lote Nuevo");

      const state = useParcelsStore.getState();
      expect(state.parcels).toHaveLength(1);
      expect(state.parcels[0].name).toBe("Lote Nuevo");
      expect(state.loading).toBe(false);
    });

    it("sets error on create failure", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const store = useParcelsStore.getState();
      await expect(
        store.create({
          name: "Fail",
          area: 1,
          location: "X",
          soil_type: "arcilloso",
        })
      ).rejects.toThrow();

      const state = useParcelsStore.getState();
      expect(state.error).toBe("Error al crear el lote");
    });
  });

  describe("update", () => {
    it("updates a parcel in the list", async () => {
      // Pre-populate parcels
      useParcelsStore.setState({ parcels: [sampleParcel] });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...sampleParcel, name: "Lote Renovado", area: 8 }),
      });

      const store = useParcelsStore.getState();
      const result = await store.update(1, { name: "Lote Renovado", area: 8 });

      expect(result.name).toBe("Lote Renovado");

      const state = useParcelsStore.getState();
      expect(state.parcels[0].name).toBe("Lote Renovado");
      expect(state.parcels[0].area).toBe(8);
    });
  });

  describe("remove", () => {
    it("removes a parcel from the list", async () => {
      useParcelsStore.setState({ parcels: sampleParcels });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      });

      const store = useParcelsStore.getState();
      await store.remove(1);

      const state = useParcelsStore.getState();
      expect(state.parcels).toHaveLength(1);
      expect(state.parcels[0].id).toBe(2);
    });

    it("sets error on remove failure", async () => {
      useParcelsStore.setState({ parcels: sampleParcels });
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const store = useParcelsStore.getState();
      await expect(store.remove(1)).rejects.toThrow();

      const state = useParcelsStore.getState();
      expect(state.error).toBe("Error al eliminar el lote");
    });
  });
});
