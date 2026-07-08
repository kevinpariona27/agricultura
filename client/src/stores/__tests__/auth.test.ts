import { describe, it, expect, beforeEach, vi } from "vitest";

// We test the store actions in isolation by mocking fetch
// The store calls the api client which calls fetch

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Because stores import from api/client which reads localStorage,
// and api/client modules import statically, we mock localStorage
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

// Dynamic import AFTER setting up mocks
import { useAuthStore } from "../auth.js";

beforeEach(() => {
  mockFetch.mockReset();
  localStorageMock.clear();

  // Reset Zustand store between tests
  useAuthStore.setState({ user: null, token: null });
});

describe("Auth store", () => {
  describe("login", () => {
    it("calls POST /api/auth/login and sets user + token on success", async () => {
      const mockUser = { id: 1, email: "test@farm.com" };
      const mockToken = "jwt-token-abc";

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: mockToken, user: mockUser }),
      });

      const store = useAuthStore.getState();
      await store.login("test@farm.com", "secret123");

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe(mockToken);
      expect(localStorageMock.setItem).toHaveBeenCalledWith("token", mockToken);

      // Verify fetch was called correctly
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/auth/login",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "test@farm.com", password: "secret123" }),
        })
      );
    });

    it("throws on failed login", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: "Invalid credentials" }),
      });

      const store = useAuthStore.getState();
      await expect(store.login("bad@test.com", "wrong")).rejects.toThrow(
        "Invalid credentials"
      );

      // State should remain unchanged
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
    });
  });

  describe("register", () => {
    it("calls POST /api/auth/register on success", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 1, email: "new@test.com" }),
      });

      const store = useAuthStore.getState();
      await store.register("new@test.com", "secret123");

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/auth/register",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "new@test.com", password: "secret123" }),
        })
      );
    });

    it("throws on duplicate email (409)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ error: "Email already registered" }),
      });

      const store = useAuthStore.getState();
      await expect(
        store.register("existing@test.com", "secret123")
      ).rejects.toThrow("Email already registered");
    });
  });

  describe("logout", () => {
    it("clears user + token and removes token from localStorage", () => {
      // Set up authenticated state
      useAuthStore.setState({
        user: { id: 1, email: "test@farm.com" },
        token: "some-token",
      });
      localStorageMock.setItem("token", "some-token");

      const store = useAuthStore.getState();
      store.logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("token");
    });
  });
});
