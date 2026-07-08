import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock the inventory store
const mockFetchAll = vi.fn().mockResolvedValue(undefined);
const mockClearError = vi.fn();

vi.mock("../../../stores/inventory", () => ({
  useInventoryStore: (selector?: (s: any) => any) => {
    const state = {
      items: [
        {
          id: 1,
          user_id: 1,
          nombre: "Fertilizante NPK",
          categoria: "fertilizante",
          cantidad: 50,
          unidad: "kg",
          fecha_adquisicion: "2026-06-01",
          fecha_vencimiento: "2027-06-01",
          costo_unitario: 120.5,
          notas: "Aplicar en primavera",
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
        },
        {
          id: 2,
          user_id: 1,
          nombre: "Semilla de maíz",
          categoria: "semilla",
          cantidad: 100,
          unidad: "bolsa",
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

import { InventoryListPage } from "../InventoryListPage";

function renderInventoryList() {
  return render(
    <MemoryRouter>
      <InventoryListPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("InventoryListPage", () => {
  it("fetches items on mount", () => {
    renderInventoryList();
    expect(mockFetchAll).toHaveBeenCalled();
  });

  it("renders the inventory table with data", () => {
    renderInventoryList();

    expect(screen.getByText("Fertilizante NPK")).toBeInTheDocument();
    expect(screen.getByText("Semilla de maíz")).toBeInTheDocument();
    // "Fertilizante" and "Semilla" appear both in filter dropdown and table cells
    expect(screen.getAllByText("Fertilizante").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Semilla").length).toBeGreaterThanOrEqual(1);
  });

  it('shows the "+ Nuevo ítem" button', () => {
    renderInventoryList();
    expect(
      screen.getByRole("button", { name: /nuevo ítem/i })
    ).toBeInTheDocument();
  });

  it("renders the filter bar elements", () => {
    renderInventoryList();

    expect(screen.getByLabelText(/buscar por nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^categoría$/i)).toBeInTheDocument();
  });
});
