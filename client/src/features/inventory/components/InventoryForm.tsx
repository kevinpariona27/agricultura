import { useState, type FormEvent } from "react";
import type { CreateInventoryData } from "../../../stores/inventory";

export interface InventoryFormData extends CreateInventoryData {}

const CATEGORIA_OPTIONS = [
  { value: "fertilizante", label: "Fertilizante" },
  { value: "pesticida", label: "Pesticida" },
  { value: "semilla", label: "Semilla" },
  { value: "herramienta", label: "Herramienta" },
  { value: "otro", label: "Otro" },
] as const;

const UNIDAD_OPTIONS = [
  { value: "kg", label: "kg" },
  { value: "L", label: "L" },
  { value: "unidad", label: "unidad" },
  { value: "bolsa", label: "bolsa" },
] as const;

interface InventoryFormProps {
  initialValues?: Partial<InventoryFormData>;
  onSubmit: (data: InventoryFormData) => Promise<void>;
  submitLabel: string;
  loading?: boolean;
}

interface FieldErrors {
  nombre?: string;
  categoria?: string;
  cantidad?: string;
  unidad?: string;
}

export function InventoryForm({
  initialValues,
  onSubmit,
  submitLabel,
  loading = false,
}: InventoryFormProps) {
  const [nombre, setNombre] = useState(initialValues?.nombre ?? "");
  const [categoria, setCategoria] = useState(
    initialValues?.categoria ?? "fertilizante"
  );
  const [cantidad, setCantidad] = useState(
    initialValues?.cantidad?.toString() ?? ""
  );
  const [unidad, setUnidad] = useState(initialValues?.unidad ?? "kg");
  const [fechaAdquisicion, setFechaAdquisicion] = useState(
    initialValues?.fecha_adquisicion ?? ""
  );
  const [fechaVencimiento, setFechaVencimiento] = useState(
    initialValues?.fecha_vencimiento ?? ""
  );
  const [costoUnitario, setCostoUnitario] = useState(
    initialValues?.costo_unitario?.toString() ?? ""
  );
  const [notas, setNotas] = useState(initialValues?.notas ?? "");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");

  function validate(): boolean {
    const next: FieldErrors = {};

    if (!nombre.trim()) {
      next.nombre = "El nombre es obligatorio";
    }

    if (!categoria) {
      next.categoria = "La categoría es obligatoria";
    }

    const cantidadNum = Number(cantidad);
    if (!cantidad || isNaN(cantidadNum) || cantidadNum <= 0) {
      next.cantidad = "La cantidad debe ser un número positivo";
    }

    if (!unidad) {
      next.unidad = "La unidad es obligatoria";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError("");

    if (!validate()) return;

    const data: InventoryFormData = {
      nombre: nombre.trim(),
      categoria,
      cantidad: Number(cantidad),
      unidad,
    };

    if (fechaAdquisicion.trim()) {
      data.fecha_adquisicion = fechaAdquisicion.trim();
    }
    if (fechaVencimiento.trim()) {
      data.fecha_vencimiento = fechaVencimiento.trim();
    }
    if (costoUnitario.trim()) {
      data.costo_unitario = Number(costoUnitario);
    }
    if (notas.trim()) {
      data.notas = notas.trim();
    }

    try {
      await onSubmit(data);
    } catch {
      setSubmitError("Error al guardar el ítem. Intente nuevamente.");
    }
  }

  const inputClass =
    "w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500";
  const labelClass = "mb-1 block text-sm font-medium text-gray-700";
  const errorClass = "mt-1 text-xs text-red-600";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {submitError && (
        <div className="rounded bg-red-50 px-4 py-2 text-sm text-red-700">
          {submitError}
        </div>
      )}

      <div>
        <label htmlFor="nombre" className={labelClass}>
          Nombre
        </label>
        <input
          id="nombre"
          type="text"
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className={inputClass}
          placeholder="Ej: Fertilizante NPK"
        />
        {errors.nombre && <p className={errorClass}>{errors.nombre}</p>}
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="categoria" className={labelClass}>
            Categoría
          </label>
          <select
            id="categoria"
            required
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className={inputClass}
          >
            {CATEGORIA_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errors.categoria && (
            <p className={errorClass}>{errors.categoria}</p>
          )}
        </div>

        <div className="flex-1">
          <label htmlFor="unidad" className={labelClass}>
            Unidad
          </label>
          <select
            id="unidad"
            required
            value={unidad}
            onChange={(e) => setUnidad(e.target.value)}
            className={inputClass}
          >
            {UNIDAD_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errors.unidad && <p className={errorClass}>{errors.unidad}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="cantidad" className={labelClass}>
          Cantidad
        </label>
        <input
          id="cantidad"
          type="number"
          required
          min="0.01"
          step="0.01"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          className={inputClass}
          placeholder="Ej: 50"
        />
        {errors.cantidad && <p className={errorClass}>{errors.cantidad}</p>}
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="fecha_adquisicion" className={labelClass}>
            Fecha de adquisición (opcional)
          </label>
          <input
            id="fecha_adquisicion"
            type="date"
            value={fechaAdquisicion}
            onChange={(e) => setFechaAdquisicion(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex-1">
          <label htmlFor="fecha_vencimiento" className={labelClass}>
            Fecha de vencimiento (opcional)
          </label>
          <input
            id="fecha_vencimiento"
            type="date"
            value={fechaVencimiento}
            onChange={(e) => setFechaVencimiento(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="costo_unitario" className={labelClass}>
          Costo unitario (opcional)
        </label>
        <input
          id="costo_unitario"
          type="number"
          min="0.01"
          step="0.01"
          value={costoUnitario}
          onChange={(e) => setCostoUnitario(e.target.value)}
          className={inputClass}
          placeholder="Ej: 120.50"
        />
      </div>

      <div>
        <label htmlFor="inventory_notes" className={labelClass}>
          Notas (opcional)
        </label>
        <textarea
          id="inventory_notes"
          rows={3}
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          className={inputClass}
          placeholder="Observaciones sobre el ítem..."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-800 disabled:opacity-50"
      >
        {loading ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}
