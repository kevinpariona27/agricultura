import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Harvest } from "@agri/shared";
import { useCropsStore } from "../../../stores/crops";
import { HARVEST_UNIT_LABELS, HARVEST_UNIT_OPTIONS } from "./HarvestForm";

interface Props { harvests: Harvest[]; onCropFilter?: (v: string) => void; onDateFrom?: (v: string) => void; onDateTo?: (v: string) => void; }

export function HarvestTable({ harvests, onCropFilter, onDateFrom, onDateTo }: Props) {
  const nav = useNavigate();
  const [cf, setCf] = useState(""); const [df, setDf] = useState(""); const [dt, setDt] = useState("");
  const crops = useCropsStore(s => s.crops); const fc = useCropsStore(s => s.fetchAll);
  useEffect(() => { if (!crops.length) fc(); }, [crops.length, fc]);
  const badge = (u: string) => (u === "kg" ? "bg-green-100 text-green-800" : "bg-purple-100 text-purple-800");
  const ic = "rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none";

  return (<div>
    <div className="mb-4 flex flex-wrap gap-3">
      <select value={cf} onChange={e => { setCf(e.target.value); onCropFilter?.(e.target.value); }} className={ic}><option value="">Todos los cultivos</option>{crops.map(c => <option key={c.id} value={c.id}>{c.variety}</option>)}</select>
      <input type="date" value={df} onChange={e => { setDf(e.target.value); onDateFrom?.(e.target.value); }} className={ic} title="Desde" />
      <input type="date" value={dt} onChange={e => { setDt(e.target.value); onDateTo?.(e.target.value); }} className={ic} title="Hasta" />
    </div>
    <div className="overflow-x-auto rounded-lg border border-gray-200"><table className="min-w-full divide-y divide-gray-200 text-sm">
      <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left font-medium text-gray-600">Cultivo</th><th className="px-4 py-3 text-left font-medium text-gray-600">Fecha cosecha</th><th className="px-4 py-3 text-left font-medium text-gray-600">Cantidad</th><th className="px-4 py-3 text-left font-medium text-gray-600">Unidad</th></tr></thead>
      <tbody className="divide-y divide-gray-100 bg-white">
        {!harvests.length ? <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No se encontraron cosechas</td></tr> :
          harvests.map(h => (<tr key={h.id} onClick={() => nav(`/harvests/${h.id}`)} className="cursor-pointer hover:bg-blue-50">
            <td className="px-4 py-3">{crops.find(c => c.id === h.crop_id)?.variety ?? `#${h.crop_id}`}</td>
            <td className="px-4 py-3">{new Date(h.fecha_cosecha + "T00:00:00").toLocaleDateString("es-AR")}</td>
            <td className="px-4 py-3">{h.cantidad.toLocaleString()}</td>
            <td className="px-4 py-3"><span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badge(h.unidad)}`}>{HARVEST_UNIT_LABELS[h.unidad]}</span></td>
          </tr>))}
      </tbody>
    </table></div>
  </div>);
}
