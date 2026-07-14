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

// Mock irrigation store
const mockFetchAll = vi.fn().mockResolvedValue(undefined);
const mockClearError = vi.fn();

vi.mock("../../../stores/irrigations.js", () => ({
  useIrrigationsStore: (selector?: (s: any) => any) => {
    const state = {
      irrigations: [
        {
          id: 1,
          crop_id: 1,
          amount: 150,
          irrigation_date: "2026-07-01",
          method: "aspersion",
          duration: 120,
          notes: "Riego matutino",
          created_at: "2026-07-01T08:00:00.000Z",
          updated_at: "2026-07-01T08:00:00.000Z",
        },
        {
          id: 2,
          crop_id: 2,
          amount: 200,
          irrigation_date: "2026-07-05",
          method: "goteo",
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

import { IrrigationListPage } from "../IrrigationListPage.js";

function renderIrrigationList() {
  return render(
    <MemoryRouter>
      <IrrigationListPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("IrrigationListPage", () => {
  it("fetches irrigations on mount", () => {
    renderIrrigationList();
    expect(mockFetchAll).toHaveBeenCalled();
  });

  it("renders the irrigation table with data", () => {
    renderIrrigationList();

    // Crop names should appear (resolved from crops store) — appear in both
    // filter dropdown and table rows
    expect(screen.getAllByText("Maíz Tempranero").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Soja RR").length).toBeGreaterThanOrEqual(2);

    // Amount should appear
    expect(screen.getByText("150")).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument();

    // Method labels should appear — appear in both filter dropdown and table rows
    expect(screen.getAllByText("Aspersión").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Goteo").length).toBeGreaterThanOrEqual(1);
  });

  it("shows the '+ Nuevo riego' button", () => {
    renderIrrigationList();
    expect(
      screen.getByRole("button", { name: /nuevo riego/i })
    ).toBeInTheDocument();
  });

  it("renders the filter elements", () => {
    renderIrrigationList();

    expect(screen.getByLabelText("Cultivo")).toBeInTheDocument();
    expect(screen.getByLabelText("Método")).toBeInTheDocument();
    expect(screen.getByLabelText("Desde")).toBeInTheDocument();
    expect(screen.getByLabelText("Hasta")).toBeInTheDocument();
  });
});
