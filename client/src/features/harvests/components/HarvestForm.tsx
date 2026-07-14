import { useState, useEffect, type FormEvent } from "react";
import type { HarvestUnit } from "@agri/shared";
import { useCropsStore } from "../../../stores/crops";

export const HARVEST_UNIT_LABELS: Record<string, string> = {
  kg: "Kilogramos", ton: "Toneladas",
};
export const HARVEST_UNIT_OPTIONS = [
  { value: "kg", label: "Kilogramos" }, { value: "ton", label: "Toneladas" },
] as const;

export interface HarvestFormData { crop_id: number; cantidad: number; unidad: HarvestUnit; fecha_cosecha: string; rendimiento?: number; perdidas?: number; notas?: string; }

export function HarvestForm({ initialValues, onSubmit, submitLabel, loading = false }: {
  initialValues?: Partial<HarvestFormData>; onSubmit: (d: HarvestFormData) => Promise<void>; submitLabel: string; loading?: boolean;
}) {
  const [cropId, setCropId] = useState(initialValues?.crop_id?.toString() ?? "");
  const [cantidad, setCantidad] = useState(initialValues?.cantidad?.toString() ?? "");
  const [unidad, setUnidad] = useState<HarvestUnit | "">(initialValues?.unidad ?? "");
  const [date, setDate] = useState(initialValues?.fecha_cosecha ?? "");
  const [rendimiento, setRendimiento] = useState(initialValues?.rendimiento?.toString() ?? "");
  const [perdidas, setPerdidas] = useState(initialValues?.perdidas?.toString() ?? "");
  const [notas, setNotas] = useState(initialValues?.notas ?? "");
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [submitError, setSubmitError] = useState("");
  const crops = useCropsStore((s) => s.crops);
  const fc = useCropsStore((s) => s.fetchAll);
  useEffect(() => { fc(); }, [fc]);

  function validate() {
    const e: Record<string,string> = {};
    if (!cropId) e.crop_id = "El cultivo es obligatorio";
    if (!cantidad || Number(cantidad) <= 0) e.cantidad = "La cantidad debe ser mayor a 0";
    if (!unidad) e.unidad = "La unidad es obligatoria";
    if (!date) e.fecha_cosecha = "La fecha es obligatoria";
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) e.fecha_cosecha = "Formato inválido (YYYY-MM-DD)";
    if (rendimiento && Number(rendimiento) < 0) e.rendimiento = "No puede ser negativo";
    if (perdidas && Number(perdidas) < 0) e.perdidas = "No puede ser negativo";
    setErrors(e); return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: FormEvent) { ev.preventDefault(); setSubmitError(""); if (!validate()) return;
    const d: HarvestFormData = { crop_id: Number(cropId), cantidad: Number(cantidad), unidad: unidad as HarvestUnit, fecha_cosecha: date };
    if (rendimiento !== "") d.rendimiento = Number(rendimiento);
    if (perdidas !== "") d.perdidas = Number(perdidas);
    if (notas.trim()) d.notas = notas.trim();
    try { await onSubmit(d); } catch { setSubmitError("Error al guardar. Intente nuevamente."); }
  }

  const ic = "w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
  const lb = "mb-1 block text-sm font-medium text-gray-700";
  const ec = "mt-1 text-xs text-red-600";

  return (<form onSubmit={handleSubmit} className="flex flex-col gap-5">
    {submitError && <div className="rounded bg-red-50 px-4 py-2 text-sm text-red-700">{submitError}</div>}
    <div><label className={lb}>Cultivo <span className="text-destructive ml-0.5">*</span></label><select required value={cropId} onChange={e => setCropId(e.target.value)} className={ic}><option value="">Seleccionar cultivo</option>{crops.map(c => <option key={c.id} value={c.id}>{c.variety}</option>)}</select>{errors.crop_id && <p className={ec}>{errors.crop_id}</p>}</div>
    <div><label className={lb}>Cantidad <span className="text-destructive ml-0.5">*</span></label><input type="number" required min="0.01" step="any" value={cantidad} onChange={e => setCantidad(e.target.value)} className={ic} placeholder="Ej: 500" />{errors.cantidad && <p className={ec}>{errors.cantidad}</p>}</div>
    <div><label className={lb}>Unidad <span className="text-destructive ml-0.5">*</span></label><select required value={unidad} onChange={e => setUnidad(e.target.value as HarvestUnit)} className={ic}><option value="">Seleccionar unidad</option>{HARVEST_UNIT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>{errors.unidad && <p className={ec}>{errors.unidad}</p>}</div>
    <div><label className={lb}>Fecha de cosecha <span className="text-destructive ml-0.5">*</span></label><input type="date" required value={date} onChange={e => setDate(e.target.value)} className={ic} />{errors.fecha_cosecha && <p className={ec}>{errors.fecha_cosecha}</p>}</div>
    <div><label className={lb}>Rendimiento (opcional)</label><input type="number" min="0" step="any" value={rendimiento} onChange={e => setRendimiento(e.target.value)} className={ic} placeholder="Ej: 12.5" />{errors.rendimiento && <p className={ec}>{errors.rendimiento}</p>}</div>
    <div><label className={lb}>Pérdidas (opcional)</label><input type="number" min="0" step="any" value={perdidas} onChange={e => setPerdidas(e.target.value)} className={ic} placeholder="Ej: 10" />{errors.perdidas && <p className={ec}>{errors.perdidas}</p>}</div>
    <div><label className={lb}>Notas (opcional)</label><textarea rows={3} value={notas} onChange={e => setNotas(e.target.value)} className={ic} placeholder="Observaciones..." /></div>
    <button type="submit" disabled={loading} className="mt-2 rounded bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">{loading ? "Guardando..." : submitLabel}</button>
  </form>);
}
