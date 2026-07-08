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
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

// Dynamic import after mocks
import { useUserStore } from "../user.js";

beforeEach(() => {
  mockFetch.mockReset();
  localStorageMock.clear();
  useUserStore.setState({ profile: null, loading: false, error: null });
});

describe("User store", () => {
  describe("fetchProfile", () => {
    it("calls GET /api/users/me and sets profile on success", async () => {
      const mockProfile = {
        id: 1,
        email: "test@farm.com",
        nombre: "Test User",
        rol: "operador",
        fecha_registro: "2026-01-15",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile,
      });

      const store = useUserStore.getState();
      await store.fetchProfile();

      const state = useUserStore.getState();
      expect(state.profile).toEqual(mockProfile);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/users/me",
        expect.objectContaining({
          method: "GET",
        })
      );
    });

    it("sets error state on fetch failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Server error" }),
      });

      const store = useUserStore.getState();
      await store.fetchProfile();

      const state = useUserStore.getState();
      expect(state.profile).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBe("Error al cargar el perfil");
    });
  });

  describe("updateProfile", () => {
    it("calls PUT /api/users/me and updates profile on success", async () => {
      const updatedProfile = {
        id: 1,
        email: "test@farm.com",
        nombre: "New Name",
        rol: "admin",
        fecha_registro: "2026-01-15",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedProfile,
      });

      const store = useUserStore.getState();
      await store.updateProfile({ nombre: "New Name", rol: "admin" });

      const state = useUserStore.getState();
      expect(state.profile).toEqual(updatedProfile);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/users/me",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({ nombre: "New Name", rol: "admin" }),
        })
      );
    });

    it("throws and sets error on update failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: "Validation failed" }),
      });

      const store = useUserStore.getState();
      await expect(
        store.updateProfile({ nombre: "" })
      ).rejects.toThrow("Error al actualizar el perfil");

      const state = useUserStore.getState();
      expect(state.error).toBe("Error al actualizar el perfil");
      expect(state.loading).toBe(false);
    });
  });

  describe("clearError", () => {
    it("clears the error state", () => {
      useUserStore.setState({ error: "Some error" });
      const store = useUserStore.getState();
      store.clearError();
      expect(useUserStore.getState().error).toBeNull();
    });
  });
});
