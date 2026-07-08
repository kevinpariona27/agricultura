import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ParcelForm } from "../components/ParcelForm.js";

describe("ParcelForm", () => {
  it("renders all form fields", () => {
    render(<ParcelForm onSubmit={async () => {}} submitLabel="Crear parcela" />);

    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/área/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ubicación/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tipo de suelo/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /crear parcela/i })
    ).toBeInTheDocument();
  });

  it("pre-fills initial values when editing", () => {
    render(
      <ParcelForm
        initialValues={{
          name: "Lote Editado",
          area: 15,
          location: "Zona centro",
          soil_type: "franco",
        }}
        onSubmit={async () => {}}
        submitLabel="Guardar cambios"
      />
    );

    const nameInput = screen.getByLabelText(/nombre/i) as HTMLInputElement;
    const areaInput = screen.getByLabelText(/área/i) as HTMLInputElement;
    const locationInput = screen.getByLabelText(/ubicación/i) as HTMLInputElement;

    expect(nameInput.value).toBe("Lote Editado");
    expect(areaInput.value).toBe("15");
    expect(locationInput.value).toBe("Zona centro");
  });

  it("shows validation error for empty name", async () => {
    const mockSubmit = vi.fn();
    render(<ParcelForm onSubmit={mockSubmit} submitLabel="Crear" />);

    // Remove required attributes to bypass HTML5 validation in jsdom
    const nameInput = screen.getByLabelText(/nombre/i);
    nameInput.removeAttribute("required");

    const areaInput = screen.getByLabelText(/área/i);
    areaInput.removeAttribute("required");

    const locationInput = screen.getByLabelText(/ubicación/i);
    locationInput.removeAttribute("required");

    const soilSelect = screen.getByLabelText(/tipo de suelo/i);
    soilSelect.removeAttribute("required");

    const submitBtn = screen.getByRole("button", { name: /crear/i });
    await userEvent.click(submitBtn);

    expect(screen.getByText(/el nombre es obligatorio/i)).toBeInTheDocument();
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it("shows validation error for invalid area", async () => {
    const mockSubmit = vi.fn();
    render(<ParcelForm onSubmit={mockSubmit} submitLabel="Crear" />);

    // Remove required attributes AND min constraint to bypass HTML5 validation in jsdom
    const nameInput = screen.getByLabelText(/nombre/i);
    nameInput.removeAttribute("required");
    const areaInput = screen.getByLabelText(/área/i);
    areaInput.removeAttribute("required");
    areaInput.removeAttribute("min");
    const locationInput = screen.getByLabelText(/ubicación/i);
    locationInput.removeAttribute("required");
    const soilSelect = screen.getByLabelText(/tipo de suelo/i);
    soilSelect.removeAttribute("required");

    await userEvent.type(nameInput, "Lote Test");
    await userEvent.type(locationInput, "Ubicación");
    await userEvent.type(areaInput, "0");

    const submitBtn = screen.getByRole("button", { name: /crear/i });
    await userEvent.click(submitBtn);

    expect(screen.getByText(/el área debe ser mayor a 0/i)).toBeInTheDocument();
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it("shows validation error for empty location", async () => {
    const mockSubmit = vi.fn();
    render(<ParcelForm onSubmit={mockSubmit} submitLabel="Crear" />);

    const nameInput = screen.getByLabelText(/nombre/i);
    nameInput.removeAttribute("required");
    const areaInput = screen.getByLabelText(/área/i);
    areaInput.removeAttribute("required");
    const locationInput = screen.getByLabelText(/ubicación/i);
    locationInput.removeAttribute("required");
    const soilSelect = screen.getByLabelText(/tipo de suelo/i);
    soilSelect.removeAttribute("required");

    await userEvent.type(nameInput, "Lote Test");
    await userEvent.type(areaInput, "5");

    const submitBtn = screen.getByRole("button", { name: /crear/i });
    await userEvent.click(submitBtn);

    expect(screen.getByText(/la ubicación es obligatoria/i)).toBeInTheDocument();
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with form data when valid", async () => {
    const mockSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ParcelForm onSubmit={mockSubmit} submitLabel="Crear" />);

    // Remove required attributes to avoid HTML5 validation
    const nameInput = screen.getByLabelText(/nombre/i);
    nameInput.removeAttribute("required");
    const areaInput = screen.getByLabelText(/área/i);
    areaInput.removeAttribute("required");
    const locationInput = screen.getByLabelText(/ubicación/i);
    locationInput.removeAttribute("required");
    const soilSelect = screen.getByLabelText(/tipo de suelo/i);
    soilSelect.removeAttribute("required");

    await userEvent.type(nameInput, "Lote Test");
    await userEvent.type(areaInput, "10.5");
    await userEvent.type(locationInput, "Zona norte");
    await userEvent.selectOptions(soilSelect, "franco");

    const submitBtn = screen.getByRole("button", { name: /crear/i });
    await userEvent.click(submitBtn);

    expect(mockSubmit).toHaveBeenCalledWith({
      name: "Lote Test",
      area: 10.5,
      location: "Zona norte",
      soil_type: "franco",
    });
  });
});
