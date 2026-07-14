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

// Mock the crops store
const mockFetchAll = vi.fn().mockResolvedValue(undefined);
const mockClearError = vi.fn();

vi.mock("../../../stores/crops.js", () => ({
  useCropsStore: (selector?: (s: any) => any) => {
    const state = {
      crops: [
        {
          id: 1,
          parcel_id: 1,
          variety: "Maíz Tempranero",
          planting_date: "2026-03-15",
          status: "en_crecimiento",
          estimated_harvest_date: "2026-08-01",
          planting_density: 75000,
          notes: "Variedad resistente",
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
        },
        {
          id: 2,
          parcel_id: 2,
          variety: "Soja RR",
          planting_date: "2026-10-01",
          status: "planificado",
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

// Mock the parcels store
const mockParcelFetchAll = vi.fn().mockResolvedValue(undefined);
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
      fetchAll: mockParcelFetchAll,
    };
    return selector ? selector(state) : state;
  },
}));

import { CropListPage } from "../CropListPage.js";

function renderCropList() {
  return render(
    <MemoryRouter>
      <CropListPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CropListPage", () => {
  it("fetches crops on mount", () => {
    renderCropList();
    expect(mockFetchAll).toHaveBeenCalled();
  });

  it("renders the crop table with data", () => {
    renderCropList();

    expect(screen.getByText("Maíz Tempranero")).toBeInTheDocument();
    expect(screen.getByText("Soja RR")).toBeInTheDocument();
    // Parcel names should be resolved (appear in both table rows and filter dropdown)
    expect(screen.getAllByText("Lote Norte").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Lote Sur").length).toBeGreaterThanOrEqual(1);
  });

  it("shows the '+ Nuevo cultivo' button", () => {
    renderCropList();
    expect(
      screen.getByRole("button", { name: /nuevo cultivo/i })
    ).toBeInTheDocument();
  });

  it("renders the filter bar elements", () => {
    renderCropList();

    expect(screen.getByLabelText(/buscar por variedad/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^parcela$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^estado$/i)).toBeInTheDocument();
  });
});
