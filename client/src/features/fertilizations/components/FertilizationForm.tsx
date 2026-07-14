import { useState, useEffect, type FormEvent } from "react";
import type { FertilizationUnit } from "@agri/shared";
import { useCropsStore } from "../../../stores/crops";
import type { CreateFertilizationData } from "../../../stores/fertilizations";

export interface FertilizationFormData extends CreateFertilizationData {}

const UNIT_OPTIONS = [
  { value: "kg/ha", label: "kg/ha" },
  { value: "L/ha", label: "L/ha" },
] as const;

interface FertilizationFormProps {
  initialValues?: Partial<FertilizationFormData>;
  onSubmit: (data: FertilizationFormData) => Promise<void>;
  submitLabel: string;
  loading?: boolean;
}

interface FieldErrors {
  crop_id?: string;
  producto?: string;
  dosis?: string;
  unidad?: string;
  fecha_aplicacion?: string;
}

export function FertilizationForm({
  initialValues,
  onSubmit,
  submitLabel,
  loading = false,
}: FertilizationFormProps) {
  const [cropId, setCropId] = useState(
    initialValues?.crop_id?.toString() ?? ""
  );
  const [producto, setProducto] = useState(initialValues?.producto ?? "");
  const [dosis, setDosis] = useState(
    initialValues?.dosis?.toString() ?? ""
  );
  const [unidad, setUnidad] = useState<FertilizationUnit>(
    (initialValues?.unidad as FertilizationUnit) ?? "kg/ha"
  );
  const [fechaAplicacion, setFechaAplicacion] = useState(
    initialValues?.fecha_aplicacion ?? ""
  );
  const [costo, setCosto] = useState(initialValues?.costo?.toString() ?? "");
  const [notas, setNotas] = useState(initialValues?.notas ?? "");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");

  const crops = useCropsStore((s) => s.crops);
  const fetchCrops = useCropsStore((s) => s.fetchAll);

  useEffect(() => {
    fetchCrops();
  }, [fetchCrops]);

  function validate(): boolean {
    const next: FieldErrors = {};

    if (!cropId) {
      next.crop_id = "El cultivo es obligatorio";
    }

    if (!producto.trim()) {
      next.producto = "El producto es obligatorio";
    }

    const dosisNum = Number(dosis);
    if (!dosis || isNaN(dosisNum) || dosisNum <= 0) {
      next.dosis = "La dosis debe ser un número mayor a 0";
    }

    if (!unidad) {
      next.unidad = "La unidad es obligatoria";
    }

    if (!fechaAplicacion) {
      next.fecha_aplicacion = "La fecha de aplicación es obligatoria";
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaAplicacion)) {
      next.fecha_aplicacion = "Formato de fecha inválido (YYYY-MM-DD)";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError("");

    if (!validate()) return;

    const data: FertilizationFormData = {
      crop_id: Number(cropId),
      producto: producto.trim(),
      dosis: Number(dosis),
      unidad: unidad as FertilizationFormData["unidad"],
      fecha_aplicacion: fechaAplicacion,
    };

    if (costo !== "") {
      data.costo = Number(costo);
    }
    if (notas.trim()) {
      data.notas = notas.trim();
    }

    try {
      await onSubmit(data);
    } catch {
      setSubmitError("Error al guardar la fertilización. Intente nuevamente.");
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
        <label htmlFor="crop_id" className={labelClass}>
          Cultivo <span className="text-destructive ml-0.5">*</span>
        </label>
        <select
          id="crop_id"
          required
          value={cropId}
          onChange={(e) => setCropId(e.target.value)}
          className={inputClass}
        >
          <option value="">Seleccionar cultivo</option>
          {crops.map((c) => (
            <option key={c.id} value={c.id}>
              {c.variety}
            </option>
          ))}
        </select>
        {errors.crop_id && <p className={errorClass}>{errors.crop_id}</p>}
      </div>

      <div>
        <label htmlFor="producto" className={labelClass}>
          Producto <span className="text-destructive ml-0.5">*</span>
        </label>
        <input
          id="producto"
          type="text"
          required
          value={producto}
          onChange={(e) => setProducto(e.target.value)}
          className={inputClass}
          placeholder="Ej: Urea"
        />
        {errors.producto && <p className={errorClass}>{errors.producto}</p>}
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="dosis" className={labelClass}>
            Dosis <span className="text-destructive ml-0.5">*</span>
          </label>
          <input
            id="dosis"
            type="number"
            required
            min="0"
            step="0.1"
            value={dosis}
            onChange={(e) => setDosis(e.target.value)}
            className={inputClass}
            placeholder="Ej: 150"
          />
          {errors.dosis && <p className={errorClass}>{errors.dosis}</p>}
        </div>

        <div className="w-32">
          <label htmlFor="unidad" className={labelClass}>
            Unidad <span className="text-destructive ml-0.5">*</span>
          </label>
          <select
            id="unidad"
            required
            value={unidad}
            onChange={(e) => setUnidad(e.target.value as FertilizationUnit)}
            className={inputClass}
          >
            {UNIT_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errors.unidad && <p className={errorClass}>{errors.unidad}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="fecha_aplicacion" className={labelClass}>
          Fecha de aplicación <span className="text-destructive ml-0.5">*</span>
        </label>
        <input
          id="fecha_aplicacion"
          type="date"
          required
          value={fechaAplicacion}
          onChange={(e) => setFechaAplicacion(e.target.value)}
          className={inputClass}
        />
        {errors.fecha_aplicacion && (
          <p className={errorClass}>{errors.fecha_aplicacion}</p>
        )}
      </div>

      <div>
        <label htmlFor="costo" className={labelClass}>
          Costo (opcional)
        </label>
        <input
          id="costo"
          type="number"
          min="0"
          step="0.01"
          value={costo}
          onChange={(e) => setCosto(e.target.value)}
          className={inputClass}
          placeholder="Ej: 25000"
        />
      </div>

      <div>
        <label htmlFor="fert_notes" className={labelClass}>
          Notas (opcional)
        </label>
        <textarea
          id="fert_notes"
          rows={3}
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          className={inputClass}
          placeholder="Observaciones sobre la fertilización..."
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
