import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "../ThemeToggle.js";

// Mock the theme store
const mockToggleTheme = vi.fn();
let currentTheme: "light" | "dark" = "light";

vi.mock("../../../stores/theme.js", () => ({
  useThemeStore: (selector?: (s: unknown) => unknown) => {
    const state = {
      theme: currentTheme,
      toggleTheme: mockToggleTheme,
      setTheme: (theme: "light" | "dark") => {
        currentTheme = theme;
      },
    };
    return selector ? selector(state) : state;
  },
}));

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

beforeEach(() => {
  vi.clearAllMocks();
  currentTheme = "light";
  localStorageMock.clear();
});

describe("ThemeToggle", () => {
  it("renders Moon icon in light mode", () => {
    currentTheme = "light";
    render(<ThemeToggle />);

    // The Moon icon should be present (light mode → show Moon to switch to dark)
    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /cambiar a modo oscuro/i })
    ).toBeInTheDocument();
  });

  it("renders Sun icon in dark mode", () => {
    currentTheme = "dark";
    render(<ThemeToggle />);

    expect(
      screen.getByRole("button", { name: /cambiar a modo claro/i })
    ).toBeInTheDocument();
  });

  it("changes aria-label between light and dark", () => {
    currentTheme = "light";
    const { rerender } = render(<ThemeToggle />);

    expect(
      screen.getByRole("button", { name: /cambiar a modo oscuro/i })
    ).toBeInTheDocument();

    // Rerender with dark theme
    currentTheme = "dark";
    rerender(<ThemeToggle />);

    expect(
      screen.getByRole("button", { name: /cambiar a modo claro/i })
    ).toBeInTheDocument();
  });

  it("calls toggleTheme on click", async () => {
    currentTheme = "light";
    render(<ThemeToggle />);

    const button = screen.getByRole("button");
    await userEvent.click(button);

    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });
});
