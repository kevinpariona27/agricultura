import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Irrigation } from "@agri/shared";
import { useCropsStore } from "../../../stores/crops";
import { IRRIGATION_METHOD_LABELS, IRRIGATION_METHOD_OPTIONS } from "./IrrigationForm";

interface Props { irrigations: Irrigation[]; onCropFilter?: (v: string) => void; onMethodFilter?: (v: string) => void; onDateFrom?: (v: string) => void; onDateTo?: (v: string) => void; }

export function IrrigationTable({ irrigations, onCropFilter, onMethodFilter, onDateFrom, onDateTo }: Props) {
  const nav = useNavigate();
  const [cf, setCf] = useState(""); const [mf, setMf] = useState(""); const [df, setDf] = useState(""); const [dt, setDt] = useState("");
  const crops = useCropsStore(s => s.crops); const fc = useCropsStore(s => s.fetchAll);
  useEffect(() => { if (!crops.length) fc(); }, [crops.length, fc]);
  const badge = (m: string) => ({ aspersion: "bg-blue-100 text-blue-800", goteo: "bg-green-100 text-green-800", inundacion: "bg-cyan-100 text-cyan-800", manual: "bg-amber-100 text-amber-800" }[m] ?? "bg-gray-100 text-gray-800");
  const ic = "rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none";

  return (<div>
    <div className="mb-4 flex flex-wrap gap-3">
      <select value={cf} onChange={e => { setCf(e.target.value); onCropFilter?.(e.target.value); }} className={ic}><option value="">Todos los cultivos</option>{crops.map(c => <option key={c.id} value={c.id}>{c.variety}</option>)}</select>
      <select value={mf} onChange={e => { setMf(e.target.value); onMethodFilter?.(e.target.value); }} className={ic}><option value="">Todos los métodos</option>{IRRIGATION_METHOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
      <input type="date" value={df} onChange={e => { setDf(e.target.value); onDateFrom?.(e.target.value); }} className={ic} title="Desde" />
      <input type="date" value={dt} onChange={e => { setDt(e.target.value); onDateTo?.(e.target.value); }} className={ic} title="Hasta" />
    </div>
    <div className="overflow-x-auto rounded-lg border border-gray-200"><table className="min-w-full divide-y divide-gray-200 text-sm">
      <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left font-medium text-gray-600">Cultivo</th><th className="px-4 py-3 text-left font-medium text-gray-600">Fecha</th><th className="px-4 py-3 text-left font-medium text-gray-600">Cantidad (L)</th><th className="px-4 py-3 text-left font-medium text-gray-600">Método</th><th className="px-4 py-3 text-left font-medium text-gray-600">Duración</th></tr></thead>
      <tbody className="divide-y divide-gray-100 bg-white">
        {!irrigations.length ? <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No se encontraron riegos</td></tr> :
          irrigations.map(i => (<tr key={i.id} onClick={() => nav(`/irrigations/${i.id}`)} className="cursor-pointer hover:bg-blue-50">
            <td className="px-4 py-3">{crops.find(c => c.id === i.crop_id)?.variety ?? `#${i.crop_id}`}</td>
            <td className="px-4 py-3">{new Date(i.irrigation_date + "T00:00:00").toLocaleDateString("es-AR")}</td>
            <td className="px-4 py-3">{i.amount.toLocaleString()}</td>
            <td className="px-4 py-3"><span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badge(i.method)}`}>{IRRIGATION_METHOD_LABELS[i.method]}</span></td>
            <td className="px-4 py-3">{i.duration ? `${i.duration} min` : "\u2014"}</td>
          </tr>))}
      </tbody>
    </table></div>
  </div>);
}
