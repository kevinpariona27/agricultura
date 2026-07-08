import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ApiError } from "../../../api/client.js";

// Mock the auth store BEFORE importing the component
const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock("../../../stores/auth.js", () => ({
  useAuthStore: (selector?: (s: unknown) => unknown) => {
    const state = {
      login: mockLogin,
      user: null,
      token: null,
    };
    return selector ? selector(state) : state;
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { LoginPage } from "../LoginPage.js";

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("LoginPage", () => {
  it("renders login form with email and password fields", () => {
    renderLoginPage();

    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /ingresar/i })
    ).toBeInTheDocument();
  });

  it("calls login store action on form submit", async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    renderLoginPage();

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitBtn = screen.getByRole("button", { name: /ingresar/i });

    await userEvent.type(emailInput, "test@farm.com");
    await userEvent.type(passwordInput, "secret123");
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("test@farm.com", "secret123");
      expect(mockNavigate).toHaveBeenCalledWith("/parcels");
    });
  });

  it("displays error on invalid credentials (401)", async () => {
    mockLogin.mockRejectedValueOnce(new ApiError("Invalid credentials", 401, {}));
    renderLoginPage();

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitBtn = screen.getByRole("button", { name: /ingresar/i });

    await userEvent.type(emailInput, "bad@test.com");
    await userEvent.type(passwordInput, "wrong");
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/credenciales inválidas/i)).toBeInTheDocument();
    });
  });

  it("has a link to the register page", () => {
    renderLoginPage();
    expect(screen.getByText(/registrarse/i)).toBeInTheDocument();
  });
});
