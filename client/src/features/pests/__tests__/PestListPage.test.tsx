import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock the pests store
const mockFetchAll = vi.fn().mockResolvedValue(undefined);
const mockClearError = vi.fn();

vi.mock("../../../stores/pests", () => ({
  usePestsStore: (selector?: (s: any) => any) => {
    const state = {
      pests: [
        {
          id: 1,
          crop_id: 1,
          tipo: "plaga",
          nombre: "Pulgón",
          severidad: "media",
          fecha_deteccion: "2026-07-01",
          estado: "activo",
          tratamiento: "Aceite de neem",
          notas: "Aplicar cada 7 días",
          user_id: 1,
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
        },
        {
          id: 2,
          crop_id: 2,
          tipo: "enfermedad",
          nombre: "Oídio",
          severidad: "alta",
          fecha_deteccion: "2026-06-15",
          estado: "controlado",
          user_id: 1,
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

import { PestListPage } from "../PestListPage";

function renderPestList() {
  return render(
    <MemoryRouter>
      <PestListPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PestListPage", () => {
  it("fetches pests on mount", () => {
    renderPestList();
    expect(mockFetchAll).toHaveBeenCalled();
  });

  it("renders the pest table with data", () => {
    renderPestList();

    expect(screen.getByText("Pulgón")).toBeInTheDocument();
    expect(screen.getByText("Oídio")).toBeInTheDocument();
    // Crop names should be resolved (appear in both table rows and filter dropdown)
    expect(screen.getAllByText("Maíz Tempranero").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Soja RR").length).toBeGreaterThanOrEqual(1);
  });

  it('shows the "+ Nueva plaga" button', () => {
    renderPestList();
    expect(
      screen.getByRole("button", { name: /nueva plaga/i })
    ).toBeInTheDocument();
  });

  it("renders the filter bar elements", () => {
    renderPestList();

    expect(screen.getByLabelText(/buscar por nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^cultivo$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^tipo$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^estado$/i)).toBeInTheDocument();
  });
});
