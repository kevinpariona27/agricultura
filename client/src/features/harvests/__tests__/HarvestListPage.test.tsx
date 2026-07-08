import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock harvest store
const mockFetchAll = vi.fn().mockResolvedValue(undefined);
const mockClearError = vi.fn();

vi.mock("../../../stores/harvests.js", () => ({
  useHarvestsStore: (selector?: (s: any) => any) => {
    const state = {
      harvests: [
        {
          id: 1,
          crop_id: 1,
          cantidad: 500,
          unidad: "kg",
          fecha_cosecha: "2026-07-01",
          rendimiento: 12,
          perdidas: 10,
          notas: "Cosecha principal",
          created_at: "2026-07-01T08:00:00.000Z",
          updated_at: "2026-07-01T08:00:00.000Z",
        },
        {
          id: 2,
          crop_id: 2,
          cantidad: 2,
          unidad: "ton",
          fecha_cosecha: "2026-07-05",
          created_at: "2026-07-05T10:00:00.000Z",
          updated_at: "2026-07-05T10:00:00.000Z",
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

// Mock crops store
const mockFetchCrops = vi.fn().mockResolvedValue(undefined);
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
      fetchAll: mockFetchCrops,
    };
    return selector ? selector(state) : state;
  },
}));

import { HarvestListPage } from "../HarvestListPage.js";

function renderHarvestList() {
  return render(
    <MemoryRouter>
      <HarvestListPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("HarvestListPage", () => {
  it("fetches harvests on mount", () => {
    renderHarvestList();
    expect(mockFetchAll).toHaveBeenCalled();
  });

  it("renders the harvest table with data", () => {
    renderHarvestList();

    // Crop names should appear (resolved from crops store)
    expect(screen.getAllByText("Maíz Tempranero").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Soja RR").length).toBeGreaterThanOrEqual(2);

    // Cantidad should appear
    expect(screen.getByText("500")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    // Unit labels should appear
    expect(screen.getAllByText("Kilogramos").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Toneladas").length).toBeGreaterThanOrEqual(1);
  });

  it("shows the '+ Nueva cosecha' button", () => {
    renderHarvestList();
    expect(
      screen.getByRole("button", { name: /nueva cosecha/i })
    ).toBeInTheDocument();
  });

  it("renders the filter elements", () => {
    renderHarvestList();

    expect(screen.getByLabelText("Cultivo")).toBeInTheDocument();
    expect(screen.getByLabelText("Desde")).toBeInTheDocument();
    expect(screen.getByLabelText("Hasta")).toBeInTheDocument();
  });
});
