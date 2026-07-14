import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

// Import after mock setup
import { AuthGuard } from "../AuthGuard.js";

beforeEach(() => {
  localStorageMock.clear();
});

/**
 * Mirror production App.tsx routing:
 *   /login is OUTSIDE AuthGuard
 *   Protected routes are INSIDE AuthGuard
 */
function renderWithRouter(initialRoute: string) {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        {/* Public — outside AuthGuard, matches production */}
        <Route path="/login" element={<div>Login Page</div>} />
        {/* Protected — inside AuthGuard, matches production */}
        <Route element={<AuthGuard />}>
          <Route path="/dashboard" element={<div>Dashboard</div>} />
          <Route path="/parcels" element={<div>Protected Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe("AuthGuard", () => {
  it("redirects unauthenticated users from /parcels to /login", () => {
    renderWithRouter("/parcels");

    // Should redirect to login page
    expect(screen.getByText("Login Page")).toBeInTheDocument();
    // Should NOT show protected content
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("renders protected content when valid token exists", () => {
    localStorageMock.setItem("token", "valid-jwt-token");

    renderWithRouter("/parcels");

    // Should show protected content
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
    // Should NOT redirect to login
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });

  it("redirects unauthenticated users from /dashboard to /login", () => {
    renderWithRouter("/dashboard");

    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
  });

  it("renders dashboard when valid token exists", () => {
    localStorageMock.setItem("token", "valid-jwt-token");

    renderWithRouter("/dashboard");

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });
});
