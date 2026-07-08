import { useState, type FormEvent } from "react";

const SOIL_TYPES = [
  "arcilloso",
  "arenoso",
  "franco",
  "calcáreo",
  "pedregoso",
  "orgánico",
] as const;

export interface ParcelFormData {
  name: string;
  area: number;
  location: string;
  soil_type: string;
}

interface ParcelFormProps {
  initialValues?: ParcelFormData;
  onSubmit: (data: ParcelFormData) => Promise<void>;
  submitLabel: string;
  loading?: boolean;
}

interface FieldErrors {
  name?: string;
  area?: string;
  location?: string;
  soil_type?: string;
}

export function ParcelForm({
  initialValues,
  onSubmit,
  submitLabel,
  loading = false,
}: ParcelFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [area, setArea] = useState(initialValues?.area?.toString() ?? "");
  const [location, setLocation] = useState(initialValues?.location ?? "");
  const [soilType, setSoilType] = useState(initialValues?.soil_type ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");

  function validate(): boolean {
    const next: FieldErrors = {};

    if (!name.trim()) {
      next.name = "El nombre es obligatorio";
    }

    const areaNum = parseFloat(area);
    if (area === "" || isNaN(areaNum)) {
      next.area = "El área es obligatoria";
    } else if (areaNum <= 0) {
      next.area = "El área debe ser mayor a 0";
    }

    if (!location.trim()) {
      next.location = "La ubicación es obligatoria";
    }

    if (!soilType) {
      next.soil_type = "El tipo de suelo es obligatorio";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError("");

    if (!validate()) return;

    try {
      await onSubmit({
        name: name.trim(),
        area: parseFloat(area),
        location: location.trim(),
        soil_type: soilType,
      });
    } catch {
      setSubmitError("Error al guardar el lote. Intente nuevamente.");
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
        <label htmlFor="name" className={labelClass}>
          Nombre
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          placeholder="Ej: Lote Norte"
        />
        {errors.name && <p className={errorClass}>{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="area" className={labelClass}>
          Área (hectáreas)
        </label>
        <input
          id="area"
          type="number"
          required
          min="0.01"
          step="0.01"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className={inputClass}
          placeholder="Ej: 5.5"
        />
        {errors.area && <p className={errorClass}>{errors.area}</p>}
      </div>

      <div>
        <label htmlFor="location" className={labelClass}>
          Ubicación
        </label>
        <input
          id="location"
          type="text"
          required
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className={inputClass}
          placeholder="Ej: Zona norte del campo"
        />
        {errors.location && <p className={errorClass}>{errors.location}</p>}
      </div>

      <div>
        <label htmlFor="soil_type" className={labelClass}>
          Tipo de suelo
        </label>
        <select
          id="soil_type"
          required
          value={soilType}
          onChange={(e) => setSoilType(e.target.value)}
          className={inputClass}
        >
          <option value="">Seleccionar tipo de suelo</option>
          {SOIL_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        {errors.soil_type && <p className={errorClass}>{errors.soil_type}</p>}
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

export { SOIL_TYPES };
