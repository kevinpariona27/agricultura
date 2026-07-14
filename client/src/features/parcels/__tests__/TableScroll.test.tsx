import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Test that table wrappers have overflow-x-auto and tables have min-w-[600px]
// We use ParcelTable as a representative sample since all table files follow the same pattern.

// Minimal mock: ParcelTable uses react-router navigate and framer-motion
import { ParcelTable } from "../../parcels/components/ParcelTable.js";

const mockParcels = [
  {
    id: 1,
    name: "Lote Norte",
    area: 15.5,
    location: "Zona A",
    soil_type: "arcilloso",
    image_url: null,
    user_id: 1,
    created_at: "2025-01-01",
    updated_at: "2025-01-01",
  },
];

function renderTable() {
  return render(
    <MemoryRouter>
      <ParcelTable parcels={mockParcels} onSearch={() => {}} onFilter={() => {}} />
    </MemoryRouter>
  );
}

describe("Table responsiveness", () => {
  it("uses overflow-x-auto wrapper class", () => {
    renderTable();

    // The table wrapper should have overflow-x-auto for horizontal scroll
    const wrapper = document.querySelector(".overflow-x-auto");
    expect(wrapper).toBeInTheDocument();
  });

  it("table has min-w-[600px] to prevent collapse on narrow viewports", () => {
    renderTable();

    const table = document.querySelector("table.min-w-\\[600px\\]");
    expect(table).toBeInTheDocument();
  });

  it("renders data cells correctly within scroll wrapper", () => {
    renderTable();

    // Table content should still be rendered correctly
    const table = document.querySelector("table");
    expect(table).toBeInTheDocument();

    // Verify data is rendered
    const nameCell = document.body.textContent;
    expect(nameCell).toContain("Lote Norte");
  });
});
