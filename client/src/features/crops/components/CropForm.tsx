import { useState, useEffect, type FormEvent } from "react";
import { useParcelsStore } from "../../../stores/parcels.js";
import type { CreateCropData } from "../../../stores/crops.js";

export const CROP_STATUS_LABELS = {
  planificado: "Planificado",
  en_crecimiento: "En crecimiento",
  floracion: "Floración",
  en_cosecha: "En cosecha",
  cosechado: "Cosechado",
  cancelado: "Cancelado",
} as const;

export const CROP_STATUS_OPTIONS = [
  { value: "planificado", label: "Planificado" },
  { value: "en_crecimiento", label: "En crecimiento" },
  { value: "floracion", label: "Floración" },
  { value: "en_cosecha", label: "En cosecha" },
  { value: "cosechado", label: "Cosechado" },
  { value: "cancelado", label: "Cancelado" },
] as const;

export interface CropFormData extends CreateCropData {}

interface CropFormProps {
  initialValues?: Partial<CropFormData>;
  onSubmit: (data: CropFormData) => Promise<void>;
  submitLabel: string;
  loading?: boolean;
}

interface FieldErrors {
  parcel_id?: string;
  variety?: string;
  planting_date?: string;
  status?: string;
}

export function CropForm({
  initialValues,
  onSubmit,
  submitLabel,
  loading = false,
}: CropFormProps) {
  const [parcelId, setParcelId] = useState(
    initialValues?.parcel_id?.toString() ?? ""
  );
  const [variety, setVariety] = useState(initialValues?.variety ?? "");
  const [plantingDate, setPlantingDate] = useState(
    initialValues?.planting_date ?? ""
  );
  const [status, setStatus] = useState(initialValues?.status ?? "");
  const [harvestDate, setHarvestDate] = useState(
    initialValues?.estimated_harvest_date ?? ""
  );
  const [density, setDensity] = useState(
    initialValues?.planting_density?.toString() ?? ""
  );
  const [notes, setNotes] = useState(initialValues?.notes ?? "");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");

  const parcels = useParcelsStore((s) => s.parcels);
  const fetchParcels = useParcelsStore((s) => s.fetchAll);

  useEffect(() => {
    fetchParcels();
  }, [fetchParcels]);

  function validate(): boolean {
    const next: FieldErrors = {};

    if (!parcelId) {
      next.parcel_id = "La parcela es obligatoria";
    }

    if (!variety.trim()) {
      next.variety = "La variedad es obligatoria";
    }

    if (!plantingDate) {
      next.planting_date = "La fecha de siembra es obligatoria";
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(plantingDate)) {
      next.planting_date = "Formato de fecha inválido (YYYY-MM-DD)";
    }

    if (!status) {
      next.status = "El estado es obligatorio";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError("");

    if (!validate()) return;

    const data: CropFormData = {
      parcel_id: Number(parcelId),
      variety: variety.trim(),
      planting_date: plantingDate,
      status: status as CropFormData["status"],
    };

    if (harvestDate) {
      data.estimated_harvest_date = harvestDate;
    }
    if (density !== "") {
      data.planting_density = Number(density);
    }
    if (notes.trim()) {
      data.notes = notes.trim();
    }

    try {
      await onSubmit(data);
    } catch {
      setSubmitError("Error al guardar el cultivo. Intente nuevamente.");
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
        <label htmlFor="parcel_id" className={labelClass}>
          Parcela <span className="text-destructive ml-0.5">*</span>
        </label>
        <select
          id="parcel_id"
          required
          value={parcelId}
          onChange={(e) => setParcelId(e.target.value)}
          className={inputClass}
        >
          <option value="">Seleccionar parcela</option>
          {parcels.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {errors.parcel_id && <p className={errorClass}>{errors.parcel_id}</p>}
      </div>

      <div>
        <label htmlFor="variety" className={labelClass}>
          Variedad <span className="text-destructive ml-0.5">*</span>
        </label>
        <input
          id="variety"
          type="text"
          required
          value={variety}
          onChange={(e) => setVariety(e.target.value)}
          className={inputClass}
          placeholder="Ej: Maíz Tempranero"
        />
        {errors.variety && <p className={errorClass}>{errors.variety}</p>}
      </div>

      <div>
        <label htmlFor="planting_date" className={labelClass}>
          Fecha de siembra <span className="text-destructive ml-0.5">*</span>
        </label>
        <input
          id="planting_date"
          type="date"
          required
          value={plantingDate}
          onChange={(e) => setPlantingDate(e.target.value)}
          className={inputClass}
        />
        {errors.planting_date && (
          <p className={errorClass}>{errors.planting_date}</p>
        )}
      </div>

      <div>
        <label htmlFor="status" className={labelClass}>
          Estado <span className="text-destructive ml-0.5">*</span>
        </label>
        <select
          id="status"
          required
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={inputClass}
        >
          <option value="">Seleccionar estado</option>
          {CROP_STATUS_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {errors.status && <p className={errorClass}>{errors.status}</p>}
      </div>

      <div>
        <label htmlFor="estimated_harvest_date" className={labelClass}>
          Fecha estimada de cosecha (opcional)
        </label>
        <input
          id="estimated_harvest_date"
          type="date"
          value={harvestDate}
          onChange={(e) => setHarvestDate(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="planting_density" className={labelClass}>
          Densidad de siembra (plantas/ha, opcional)
        </label>
        <input
          id="planting_density"
          type="number"
          min="0"
          value={density}
          onChange={(e) => setDensity(e.target.value)}
          className={inputClass}
          placeholder="Ej: 75000"
        />
      </div>

      <div>
        <label htmlFor="crop_notes" className={labelClass}>
          Notas (opcional)
        </label>
        <textarea
          id="crop_notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={inputClass}
          placeholder="Observaciones sobre el cultivo..."
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
