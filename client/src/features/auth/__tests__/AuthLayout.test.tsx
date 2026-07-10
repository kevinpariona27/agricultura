import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

// Mock the theme store used by AuthNavbar (via ThemeToggle)
vi.mock("../../../stores/theme.js", () => ({
  useThemeStore: (selector?: (s: unknown) => unknown) => {
    const state = {
      theme: "light",
      toggleTheme: () => {},
      setTheme: () => {},
    };
    return selector ? selector(state) : state;
  },
}));

import { AuthLayout } from "../../../shared/layout/AuthLayout.js";

function renderAuthLayout(initialRoute: string) {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<div>Login Page Content</div>} />
          <Route path="/register" element={<div>Register Page Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe("AuthLayout", () => {
  it("renders AuthNavbar with logo", () => {
    renderAuthLayout("/login");

    // AuthNavbar should display the logo text
    expect(screen.getByText("AgroExec")).toBeInTheDocument();
  });

  it("renders the CTA button for the current route", () => {
    renderAuthLayout("/login");

    // On /login, CTA should show "Registrarse"
    expect(screen.getByRole("link", { name: /registrarse/i })).toBeInTheDocument();
  });

  it("renders child page via Outlet", () => {
    renderAuthLayout("/login");

    // Child route content should be rendered inside the layout
    expect(screen.getByText("Login Page Content")).toBeInTheDocument();
  });

  it("renders RegisterPage content on /register route", () => {
    renderAuthLayout("/register");

    // On register route, child content should be register page
    expect(screen.getByText("Register Page Content")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /iniciar sesión/i })).toBeInTheDocument();
  });
});
