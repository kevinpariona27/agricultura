import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ApiError } from "../../../api/client.js";

const mockRegister = vi.fn();
const mockNavigate = vi.fn();

vi.mock("../../../stores/auth.js", () => ({
  useAuthStore: (selector?: (s: unknown) => unknown) => {
    const state = {
      register: mockRegister,
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

import { RegisterPage } from "../RegisterPage.js";

function renderRegisterPage() {
  return render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("RegisterPage", () => {
  it("renders register form with email, password and confirm fields", () => {
    renderRegisterPage();

    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/contraseña/i)).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: /crear cuenta/i })
    ).toBeInTheDocument();
  });

  it("calls register store action on valid submit", async () => {
    mockRegister.mockResolvedValueOnce(undefined);
    renderRegisterPage();

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInputs = screen.getAllByLabelText(/contraseña/i);
    const submitBtn = screen.getByRole("button", { name: /crear cuenta/i });

    await userEvent.type(emailInput, "new@test.com");
    await userEvent.type(passwordInputs[0], "secret123");
    await userEvent.type(passwordInputs[1], "secret123");
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith("new@test.com", "secret123");
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  it("displays error for duplicate email (409)", async () => {
    mockRegister.mockRejectedValueOnce(
      new ApiError("Email already registered", 409, {})
    );
    renderRegisterPage();

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInputs = screen.getAllByLabelText(/contraseña/i);
    const submitBtn = screen.getByRole("button", { name: /crear cuenta/i });

    await userEvent.type(emailInput, "existing@test.com");
    await userEvent.type(passwordInputs[0], "secret123");
    await userEvent.type(passwordInputs[1], "secret123");
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/el correo electrónico ya está registrado/i)
      ).toBeInTheDocument();
    });
  });

  it("shows error when passwords do not match", async () => {
    renderRegisterPage();

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInputs = screen.getAllByLabelText(/contraseña/i);
    const submitBtn = screen.getByRole("button", { name: /crear cuenta/i });

    await userEvent.type(emailInput, "new@test.com");
    await userEvent.type(passwordInputs[0], "secret123");
    await userEvent.type(passwordInputs[1], "different");
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/las contraseñas no coinciden/i)
      ).toBeInTheDocument();
    });
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("shows error when password is too short", async () => {
    renderRegisterPage();

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInputs = screen.getAllByLabelText(/contraseña/i);
    const submitBtn = screen.getByRole("button", { name: /crear cuenta/i });

    await userEvent.type(emailInput, "new@test.com");
    await userEvent.type(passwordInputs[0], "1234567");
    await userEvent.type(passwordInputs[1], "1234567");
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/la contraseña debe tener al menos 8 caracteres/i)
      ).toBeInTheDocument();
    });
    expect(mockRegister).not.toHaveBeenCalled();
  });
});
