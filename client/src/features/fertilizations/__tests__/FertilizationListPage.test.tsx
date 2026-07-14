import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock the auth store for ProtectedAction
vi.mock("../../../stores/auth.js", () => ({
  useUserRole: () => "admin",
  useAuthStore: (selector?: (s: any) => any) => {
    const state = { user: null, token: null, role: "admin" };
    return selector ? selector(state) : state;
  },
}));

// Mock the fertilizations store
const mockFetchAll = vi.fn().mockResolvedValue(undefined);
const mockClearError = vi.fn();

vi.mock("../../../stores/fertilizations", () => ({
  useFertilizationsStore: (selector?: (s: any) => any) => {
    const state = {
      fertilizations: [
        {
          id: 1,
          crop_id: 1,
          producto: "Urea",
          dosis: 150,
          unidad: "kg/ha",
          fecha_aplicacion: "2026-03-15",
          costo: 25000,
          notas: "Aplicación temprana",
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
        },
        {
          id: 2,
          crop_id: 2,
          producto: "Fosfato diamónico",
          dosis: 100,
          unidad: "kg/ha",
          fecha_aplicacion: "2026-04-01",
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

// Mock the crops store
vi.mock("../../../stores/crops", () => ({
  useCropsStore: (selector?: (s: any) => any) => {
    const state = {
      crops: [
        {
          id: 1,
          parcel_id: 1,
          variety: "Maíz Tempranero",
          planting_date: "2026-03-15",
          status: "en_crecimiento",
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
        },
        {
          id: 2,
          parcel_id: 1,
          variety: "Soja RR",
          planting_date: "2026-10-01",
          status: "planificado",
          created_at: "2026-01-02T00:00:00.000Z",
          updated_at: "2026-01-02T00:00:00.000Z",
        },
      ],
      loading: false,
      error: null,
      fetchAll: vi.fn().mockResolvedValue(undefined),
    };
    return selector ? selector(state) : state;
  },
}));

import { FertilizationListPage } from "../FertilizationListPage";

function renderFertList() {
  return render(
    <MemoryRouter>
      <FertilizationListPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("FertilizationListPage", () => {
  it("fetches fertilizations on mount", () => {
    renderFertList();
    expect(mockFetchAll).toHaveBeenCalled();
  });

  it("renders the fertilization table with data", () => {
    renderFertList();

    expect(screen.getByText("Urea")).toBeInTheDocument();
    expect(screen.getByText("Fosfato diamónico")).toBeInTheDocument();
    // Crop names should be resolved (appear in both table rows and filter dropdown)
    expect(screen.getAllByText("Maíz Tempranero").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Soja RR").length).toBeGreaterThanOrEqual(1);
  });

  it("shows the '+ Nueva fertilización' button", () => {
    renderFertList();
    expect(
      screen.getByRole("button", { name: /nueva fertilización/i })
    ).toBeInTheDocument();
  });

  it("renders the filter bar elements", () => {
    renderFertList();

    expect(screen.getByLabelText(/buscar por producto/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^cultivo$/i)).toBeInTheDocument();
  });
});
