import { useState, useEffect, type FormEvent } from "react";
import { useCropsStore } from "../../../stores/crops";
import type { CreatePestData } from "../../../stores/pests";

export interface PestFormData extends CreatePestData {}

const TIPO_OPTIONS = [
  { value: "plaga", label: "Plaga" },
  { value: "enfermedad", label: "Enfermedad" },
] as const;

const SEVERITY_OPTIONS = [
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
] as const;

const ESTADO_OPTIONS = [
  { value: "activo", label: "Activo" },
  { value: "controlado", label: "Controlado" },
  { value: "erradicado", label: "Erradicado" },
] as const;

interface PestFormProps {
  initialValues?: Partial<PestFormData>;
  onSubmit: (data: PestFormData) => Promise<void>;
  submitLabel: string;
  loading?: boolean;
}

interface FieldErrors {
  crop_id?: string;
  tipo?: string;
  nombre?: string;
  severidad?: string;
  fecha_deteccion?: string;
  estado?: string;
}

export function PestForm({
  initialValues,
  onSubmit,
  submitLabel,
  loading = false,
}: PestFormProps) {
  const [cropId, setCropId] = useState(
    initialValues?.crop_id?.toString() ?? ""
  );
  const [tipo, setTipo] = useState(initialValues?.tipo ?? "plaga");
  const [nombre, setNombre] = useState(initialValues?.nombre ?? "");
  const [severidad, setSeveridad] = useState(initialValues?.severidad ?? "media");
  const [fechaDeteccion, setFechaDeteccion] = useState(
    initialValues?.fecha_deteccion ?? ""
  );
  const [tratamiento, setTratamiento] = useState(
    initialValues?.tratamiento ?? ""
  );
  const [estado, setEstado] = useState(initialValues?.estado ?? "activo");
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

    if (!tipo) {
      next.tipo = "El tipo es obligatorio";
    }

    if (!nombre.trim()) {
      next.nombre = "El nombre es obligatorio";
    }

    if (!severidad) {
      next.severidad = "La severidad es obligatoria";
    }

    if (!fechaDeteccion) {
      next.fecha_deteccion = "La fecha de detección es obligatoria";
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaDeteccion)) {
      next.fecha_deteccion = "Formato de fecha inválido (YYYY-MM-DD)";
    }

    if (!estado) {
      next.estado = "El estado es obligatorio";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError("");

    if (!validate()) return;

    const data: PestFormData = {
      crop_id: Number(cropId),
      tipo,
      nombre: nombre.trim(),
      severidad,
      fecha_deteccion: fechaDeteccion,
      estado,
    };

    if (tratamiento.trim()) {
      data.tratamiento = tratamiento.trim();
    }
    if (notas.trim()) {
      data.notas = notas.trim();
    }

    try {
      await onSubmit(data);
    } catch {
      setSubmitError("Error al guardar la plaga. Intente nuevamente.");
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

      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="tipo" className={labelClass}>
            Tipo <span className="text-destructive ml-0.5">*</span>
          </label>
          <select
            id="tipo"
            required
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className={inputClass}
          >
            {TIPO_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errors.tipo && <p className={errorClass}>{errors.tipo}</p>}
        </div>

        <div className="flex-1">
          <label htmlFor="severidad" className={labelClass}>
            Severidad <span className="text-destructive ml-0.5">*</span>
          </label>
          <select
            id="severidad"
            required
            value={severidad}
            onChange={(e) => setSeveridad(e.target.value)}
            className={inputClass}
          >
            {SEVERITY_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errors.severidad && <p className={errorClass}>{errors.severidad}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="nombre" className={labelClass}>
          Nombre <span className="text-destructive ml-0.5">*</span>
        </label>
        <input
          id="nombre"
          type="text"
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className={inputClass}
          placeholder="Ej: Pulgón"
        />
        {errors.nombre && <p className={errorClass}>{errors.nombre}</p>}
      </div>

      <div>
        <label htmlFor="fecha_deteccion" className={labelClass}>
          Fecha de detección <span className="text-destructive ml-0.5">*</span>
        </label>
        <input
          id="fecha_deteccion"
          type="date"
          required
          value={fechaDeteccion}
          onChange={(e) => setFechaDeteccion(e.target.value)}
          className={inputClass}
        />
        {errors.fecha_deteccion && (
          <p className={errorClass}>{errors.fecha_deteccion}</p>
        )}
      </div>

      <div>
        <label htmlFor="estado" className={labelClass}>
          Estado <span className="text-destructive ml-0.5">*</span>
        </label>
        <select
          id="estado"
          required
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className={inputClass}
        >
          {ESTADO_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {errors.estado && <p className={errorClass}>{errors.estado}</p>}
      </div>

      <div>
        <label htmlFor="tratamiento" className={labelClass}>
          Tratamiento (opcional)
        </label>
        <input
          id="tratamiento"
          type="text"
          value={tratamiento}
          onChange={(e) => setTratamiento(e.target.value)}
          className={inputClass}
          placeholder="Ej: Aceite de neem"
        />
      </div>

      <div>
        <label htmlFor="pest_notes" className={labelClass}>
          Notas (opcional)
        </label>
        <textarea
          id="pest_notes"
          rows={3}
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          className={inputClass}
          placeholder="Observaciones sobre la plaga..."
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
