import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock the auth store to provide admin role for ProtectedAction
vi.mock("../../../stores/auth.js", () => ({
  useUserRole: () => "admin",
  useAuthStore: (selector?: (s: any) => any) => {
    const state = { user: null, token: null, role: "admin" };
    return selector ? selector(state) : state;
  },
}));

// Mock the parcels store
const mockFetchAll = vi.fn().mockResolvedValue(undefined);
const mockClearError = vi.fn();

vi.mock("../../../stores/parcels.js", () => ({
  useParcelsStore: (selector?: (s: any) => any) => {
    const state = {
      parcels: [
        {
          id: 1,
          user_id: 1,
          name: "Lote Norte",
          area: 5.5,
          location: "Zona norte",
          soil_type: "arcilloso",
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
        },
        {
          id: 2,
          user_id: 1,
          name: "Lote Sur",
          area: 12,
          location: "Zona sur",
          soil_type: "franco",
          created_at: "2026-01-02T00:00:00.000Z",
          updated_at: "2026-01-02T00:00:00.000Z",
        },
      ],
      loading: false,
      error: null,
      fetchAll: mockFetchAll,
      clearError: mockClearError,
    };
    return selector ? selector(state) : state;
  },
}));

import { ParcelListPage } from "../ParcelListPage.js";

function renderParcelList() {
  return render(
    <MemoryRouter>
      <ParcelListPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ParcelListPage", () => {
  it("fetches parcels on mount", () => {
    renderParcelList();
    expect(mockFetchAll).toHaveBeenCalled();
  });

  it("renders the parcel table with data", () => {
    renderParcelList();

    expect(screen.getByText("Lote Norte")).toBeInTheDocument();
    expect(screen.getByText("Lote Sur")).toBeInTheDocument();
    expect(screen.getByText("5.5")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("shows the 'Nueva parcela' button", () => {
    renderParcelList();
    expect(
      screen.getByRole("button", { name: /nueva parcela/i })
    ).toBeInTheDocument();
  });

  it("renders the search input and soil type filter", () => {
    renderParcelList();

    expect(screen.getByLabelText(/buscar por nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tipo de suelo/i)).toBeInTheDocument();
  });
});
