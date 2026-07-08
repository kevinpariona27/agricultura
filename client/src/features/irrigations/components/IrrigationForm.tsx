import { useState, useEffect, type FormEvent } from "react";
import type { IrrigationMethod } from "@agri/shared";
import { useCropsStore } from "../../../stores/crops";

export const IRRIGATION_METHOD_LABELS: Record<string, string> = {
  aspersion: "Aspersión", goteo: "Goteo", inundacion: "Inundación", manual: "Manual",
};
export const IRRIGATION_METHOD_OPTIONS = [
  { value: "aspersion", label: "Aspersión" }, { value: "goteo", label: "Goteo" },
  { value: "inundacion", label: "Inundación" }, { value: "manual", label: "Manual" },
] as const;

export interface IrrigationFormData { crop_id: number; amount: number; irrigation_date: string; method: IrrigationMethod; duration?: number; notes?: string; }

export function IrrigationForm({ initialValues, onSubmit, submitLabel, loading = false }: {
  initialValues?: Partial<IrrigationFormData>; onSubmit: (d: IrrigationFormData) => Promise<void>; submitLabel: string; loading?: boolean;
}) {
  const [cropId, setCropId] = useState(initialValues?.crop_id?.toString() ?? "");
  const [amount, setAmount] = useState(initialValues?.amount?.toString() ?? "");
  const [date, setDate] = useState(initialValues?.irrigation_date ?? "");
  const [method, setMethod] = useState<IrrigationMethod | "">(initialValues?.method ?? "");
  const [duration, setDuration] = useState(initialValues?.duration?.toString() ?? "");
  const [notes, setNotes] = useState(initialValues?.notes ?? "");
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [submitError, setSubmitError] = useState("");
  const crops = useCropsStore((s) => s.crops);
  const fc = useCropsStore((s) => s.fetchAll);
  useEffect(() => { fc(); }, [fc]);

  function validate() {
    const e: Record<string,string> = {};
    if (!cropId) e.crop_id = "El cultivo es obligatorio";
    if (!amount || Number(amount) <= 0) e.amount = "La cantidad debe ser mayor a 0";
    if (!date) e.irrigation_date = "La fecha es obligatoria";
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) e.irrigation_date = "Formato inválido (YYYY-MM-DD)";
    if (!method) e.method = "El método es obligatorio";
    setErrors(e); return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: FormEvent) { ev.preventDefault(); setSubmitError(""); if (!validate()) return;
    const d: IrrigationFormData = { crop_id: Number(cropId), amount: Number(amount), irrigation_date: date, method: method as IrrigationMethod };
    if (duration !== "") d.duration = Number(duration);
    if (notes.trim()) d.notes = notes.trim();
    try { await onSubmit(d); } catch { setSubmitError("Error al guardar. Intente nuevamente."); }
  }

  const ic = "w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
  const lb = "mb-1 block text-sm font-medium text-gray-700";
  const ec = "mt-1 text-xs text-red-600";

  return (<form onSubmit={handleSubmit} className="flex flex-col gap-5">
    {submitError && <div className="rounded bg-red-50 px-4 py-2 text-sm text-red-700">{submitError}</div>}
    <div><label className={lb}>Cultivo</label><select required value={cropId} onChange={e => setCropId(e.target.value)} className={ic}><option value="">Seleccionar cultivo</option>{crops.map(c => <option key={c.id} value={c.id}>{c.variety}</option>)}</select>{errors.crop_id && <p className={ec}>{errors.crop_id}</p>}</div>
    <div><label className={lb}>Cantidad (litros)</label><input type="number" required min="0.01" step="any" value={amount} onChange={e => setAmount(e.target.value)} className={ic} placeholder="Ej: 500" />{errors.amount && <p className={ec}>{errors.amount}</p>}</div>
    <div><label className={lb}>Fecha</label><input type="date" required value={date} onChange={e => setDate(e.target.value)} className={ic} />{errors.irrigation_date && <p className={ec}>{errors.irrigation_date}</p>}</div>
    <div><label className={lb}>Método</label><select required value={method} onChange={e => setMethod(e.target.value as IrrigationMethod)} className={ic}><option value="">Seleccionar método</option>{IRRIGATION_METHOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>{errors.method && <p className={ec}>{errors.method}</p>}</div>
    <div><label className={lb}>Duración (min, opcional)</label><input type="number" min="1" value={duration} onChange={e => setDuration(e.target.value)} className={ic} placeholder="Ej: 45" /></div>
    <div><label className={lb}>Notas (opcional)</label><textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} className={ic} placeholder="Observaciones..." /></div>
    <button type="submit" disabled={loading} className="mt-2 rounded bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">{loading ? "Guardando..." : submitLabel}</button>
  </form>);
}
