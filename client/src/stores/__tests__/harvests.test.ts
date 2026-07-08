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
import { useHarvestsStore } from "../harvests";

const sampleHarvest: import("@agri/shared").Harvest = {
  id: 1,
  crop_id: 1,
  cantidad: 500,
  unidad: "kg",
  fecha_cosecha: "2026-03-15",
  rendimiento: 12,
  perdidas: 10,
  notas: "Cosecha principal",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

const sampleHarvests = [
  sampleHarvest,
  {
    ...sampleHarvest,
    id: 2,
    cantidad: 2,
    unidad: "ton" as const,
    rendimiento: undefined,
    perdidas: undefined,
    notas: undefined,
  },
];

beforeEach(() => {
  useHarvestsStore.setState({
    harvests: [],
    current: null,
    loading: false,
    error: null,
  });
});

describe("Harvests store", () => {
  describe("fetchAll", () => {
    it("populates harvests array and clears error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => sampleHarvests,
      });

      const store = useHarvestsStore.getState();
      await store.fetchAll();

      const state = useHarvestsStore.getState();
      expect(state.harvests).toHaveLength(2);
      expect(state.harvests[0].cantidad).toBe(500);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("passes filters as query params", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const store = useHarvestsStore.getState();
      await store.fetchAll({
        crop_id: 1,
        date_from: "2026-01-01",
        date_to: "2026-12-31",
      });

      const calls = mockFetch.mock.calls[0] as [string, RequestInit];
      const url = calls[0];
      expect(url).toContain("crop_id=1");
      expect(url).toContain("date_from=2026-01-01");
      expect(url).toContain("date_to=2026-12-31");
    });

    it("sets error state on fetch failure", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const store = useHarvestsStore.getState();
      await store.fetchAll();

      const state = useHarvestsStore.getState();
      expect(state.error).toBe("Error al cargar las cosechas");
      expect(state.loading).toBe(false);
    });
  });

  describe("fetchOne", () => {
    it("sets current harvest", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => sampleHarvest,
      });

      const store = useHarvestsStore.getState();
      await store.fetchOne(1);

      const state = useHarvestsStore.getState();
      expect(state.current).not.toBeNull();
      expect(state.current?.cantidad).toBe(500);
      expect(state.current?.unidad).toBe("kg");
      expect(state.loading).toBe(false);
    });
  });

  describe("create", () => {
    it("appends new harvest to the array", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          ...sampleHarvest,
          id: 3,
          cantidad: 1000,
          unidad: "ton",
        }),
      });

      const store = useHarvestsStore.getState();
      const result = await store.create({
        crop_id: 1,
        cantidad: 1000,
        unidad: "ton",
        fecha_cosecha: "2026-04-01",
      });

      expect(result.cantidad).toBe(1000);
      expect(result.unidad).toBe("ton");

      const state = useHarvestsStore.getState();
      expect(state.harvests).toHaveLength(1);
      expect(state.harvests[0].cantidad).toBe(1000);
      expect(state.loading).toBe(false);
    });
  });

  describe("update", () => {
    it("replaces harvest in array and updates current", async () => {
      useHarvestsStore.setState({
        harvests: [sampleHarvest],
        current: sampleHarvest,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...sampleHarvest,
          cantidad: 750,
          unidad: "ton",
        }),
      });

      const store = useHarvestsStore.getState();
      const result = await store.update(1, {
        cantidad: 750,
        unidad: "ton",
      });

      expect(result.cantidad).toBe(750);
      expect(result.unidad).toBe("ton");

      const state = useHarvestsStore.getState();
      expect(state.harvests[0].cantidad).toBe(750);
      expect(state.harvests[0].unidad).toBe("ton");
      expect(state.current?.cantidad).toBe(750);
    });
  });

  describe("remove", () => {
    it("removes harvest from array and clears current", async () => {
      useHarvestsStore.setState({
        harvests: sampleHarvests,
        current: sampleHarvest,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      });

      const store = useHarvestsStore.getState();
      await store.remove(1);

      const state = useHarvestsStore.getState();
      expect(state.harvests).toHaveLength(1);
      expect(state.harvests[0].id).toBe(2);
      expect(state.current).toBeNull();
    });
  });

  describe("clearError", () => {
    it("clears the error state", () => {
      useHarvestsStore.setState({ error: "some error" });
      const store = useHarvestsStore.getState();
      store.clearError();
      expect(useHarvestsStore.getState().error).toBeNull();
    });
  });
});
