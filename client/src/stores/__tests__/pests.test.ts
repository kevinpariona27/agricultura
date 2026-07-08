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
import { usePestsStore } from "../pests";

const samplePest = {
  id: 1,
  crop_id: 1,
  tipo: "plaga" as const,
  nombre: "Pulgón",
  severidad: "media" as const,
  fecha_deteccion: "2026-07-01",
  estado: "activo" as const,
  tratamiento: "Aceite de neem",
  notas: "Aplicar cada 7 días",
  user_id: 1,
  created_at: "2026-07-01T00:00:00.000Z",
  updated_at: "2026-07-01T00:00:00.000Z",
};

const samplePests = [
  samplePest,
  {
    ...samplePest,
    id: 2,
    nombre: "Oídio",
    tipo: "enfermedad" as const,
    severidad: "alta" as const,
    estado: "controlado" as const,
    tratamiento: undefined,
    notas: undefined,
  },
];

beforeEach(() => {
  usePestsStore.setState({
    pests: [],
    current: null,
    loading: false,
    error: null,
  });
});

describe("Pests store", () => {
  describe("fetchAll", () => {
    it("populates pests array and clears error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => samplePests,
      });

      const store = usePestsStore.getState();
      await store.fetchAll();

      const state = usePestsStore.getState();
      expect(state.pests).toHaveLength(2);
      expect(state.pests[0].nombre).toBe("Pulgón");
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("passes filters as query params", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const store = usePestsStore.getState();
      await store.fetchAll({
        crop_id: 1,
        tipo: "plaga",
        estado: "activo",
        search: "pul",
      });

      const calls = mockFetch.mock.calls[0] as [string, RequestInit];
      const url = calls[0];
      expect(url).toContain("crop_id=1");
      expect(url).toContain("tipo=plaga");
      expect(url).toContain("estado=activo");
      expect(url).toContain("nombre=pul");
    });

    it("sets error state on fetch failure", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const store = usePestsStore.getState();
      await store.fetchAll();

      const state = usePestsStore.getState();
      expect(state.error).toBe("Error al cargar las plagas");
      expect(state.loading).toBe(false);
    });
  });

  describe("fetchOne", () => {
    it("sets current pest", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => samplePest,
      });

      const store = usePestsStore.getState();
      await store.fetchOne(1);

      const state = usePestsStore.getState();
      expect(state.current).not.toBeNull();
      expect(state.current?.nombre).toBe("Pulgón");
      expect(state.loading).toBe(false);
    });
  });

  describe("create", () => {
    it("appends new pest to the array", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          ...samplePest,
          id: 3,
          nombre: "Mosca blanca",
        }),
      });

      const store = usePestsStore.getState();
      const result = await store.create({
        crop_id: 1,
        tipo: "plaga",
        nombre: "Mosca blanca",
        severidad: "baja",
        fecha_deteccion: "2026-07-08",
        estado: "activo",
      });

      expect(result.nombre).toBe("Mosca blanca");

      const state = usePestsStore.getState();
      expect(state.pests).toHaveLength(1);
      expect(state.pests[0].nombre).toBe("Mosca blanca");
      expect(state.loading).toBe(false);
    });
  });

  describe("update", () => {
    it("replaces pest in array and updates current", async () => {
      usePestsStore.setState({ pests: [samplePest], current: samplePest });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...samplePest,
          severidad: "alta" as const,
          estado: "controlado" as const,
        }),
      });

      const store = usePestsStore.getState();
      const result = await store.update(1, {
        severidad: "alta",
        estado: "controlado",
      });

      expect(result.severidad).toBe("alta");

      const state = usePestsStore.getState();
      expect(state.pests[0].severidad).toBe("alta");
      expect(state.pests[0].estado).toBe("controlado");
      expect(state.current?.severidad).toBe("alta");
    });
  });

  describe("remove", () => {
    it("removes pest from array and clears current", async () => {
      usePestsStore.setState({
        pests: samplePests,
        current: samplePest,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      });

      const store = usePestsStore.getState();
      await store.remove(1);

      const state = usePestsStore.getState();
      expect(state.pests).toHaveLength(1);
      expect(state.pests[0].id).toBe(2);
      expect(state.current).toBeNull();
    });
  });

  describe("clearError", () => {
    it("clears the error state", () => {
      usePestsStore.setState({ error: "some error" });
      const store = usePestsStore.getState();
      store.clearError();
      expect(usePestsStore.getState().error).toBeNull();
    });
  });
});
