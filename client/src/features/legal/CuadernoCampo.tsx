import { useState } from "react";
import * as XLSX from "xlsx";
import { ClipboardCheck } from "lucide-react";
import { useParcelsStore } from "../../stores/parcels";
import { get } from "../../api/client";

interface AplicacionRow {
  Fecha: string;
  Parcela: string;
  Cultivo: string;
  Producto: string;
  Dosis: number;
  Unidad: string;
  Tipo: string;
  "Plazo de Seguridad (días)": string;
}

interface CosechaRow {
  Fecha: string;
  Parcela: string;
  Cultivo: string;
  Cantidad: number;
  Unidad: string;
  "Rendimiento (kg/ha)": number | string;
}

interface RiegoRow {
  Fecha: string;
  Parcela: string;
  Cultivo: string;
  Método: string;
  "Cantidad (mm)": number;
  "Duración (h)": number | string;
}

type FertilizacionRaw = {
  id: number;
  crop_id: number;
  producto: string;
  dosis: number;
  unidad: string;
  fecha_aplicacion: string;
  notas?: string;
  costo?: number;
  created_at: string;
  updated_at: string;
  crop_variety?: string;
  parcel_name?: string;
  parcel_id?: number;
};

type PestRaw = {
  id: number;
  crop_id: number;
  tipo: string;
  nombre: string;
  severidad: string;
  fecha_deteccion: string;
  tratamiento?: string;
  estado: string;
  notas?: string;
  image_url?: string | null;
  user_id: number;
  created_at: string;
  updated_at: string;
  crop_variety?: string;
  parcel_name?: string;
  parcel_id?: number;
};

type HarvestRaw = {
  id: number;
  crop_id: number;
  cantidad: number;
  unidad: string;
  fecha_cosecha: string;
  rendimiento?: number;
  perdidas?: number;
  notas?: string;
  created_at: string;
  updated_at: string;
  crop_variety?: string;
  parcel_name?: string;
  parcel_id?: number;
};

type IrrigationRaw = {
  id: number;
  crop_id: number;
  amount: number;
  irrigation_date: string;
  method: string;
  duration?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  crop_variety?: string;
  parcel_name?: string;
  parcel_id?: number;
};

function formatMethod(method: string): string {
  const map: Record<string, string> = {
    aspersion: "Aspersión",
    goteo: "Goteo",
    inundacion: "Inundación",
    manual: "Manual",
  };
  return map[method] ?? method;
}

function isInDateRange(dateStr: string, from: string, to: string): boolean {
  if (!from && !to) return true;
  if (from && dateStr < from) return false;
  if (to && dateStr > to) return false;
  return true;
}

export function CuadernoCampo() {
  const { parcels, fetchAll } = useParcelsStore();
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [parcelId, setParcelId] = useState<number | "">("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const productor = localStorage.getItem("userName") ?? "Productor";

  async function handleGenerate() {
    setError("");
    setGenerating(true);

    try {
      // Load parcels if not yet loaded
      if (parcels.length === 0) {
        await fetchAll();
      }

      // Fetch all data needed for the three sheets
      const [fertilizaciones, plagas, cosechas, riegos] = await Promise.all([
        get<FertilizacionRaw[]>("/fertilizations").catch(() => [] as FertilizacionRaw[]),
        get<PestRaw[]>("/pests").catch(() => [] as PestRaw[]),
        get<HarvestRaw[]>("/harvests?date_from=" + (desde || "") + "&date_to=" + (hasta || "")).catch(() => [] as HarvestRaw[]),
        get<IrrigationRaw[]>("/irrigations?date_from=" + (desde || "") + "&date_to=" + (hasta || "")).catch(() => [] as IrrigationRaw[]),
      ]);

      // Build a parcel_id → name lookup
      const parcelMap = new Map<number, string>();
      parcels.forEach((p) => parcelMap.set(p.id, p.name));

      // --- Sheet 1: Aplicaciones (fertilizaciones + pest treatments) ---
      const aplicaciones: AplicacionRow[] = [];

      for (const fert of fertilizaciones) {
        // Filter by parcel if selected
        if (parcelId && fert.parcel_id !== Number(parcelId)) continue;
        if (!isInDateRange(fert.fecha_aplicacion, desde, hasta)) continue;

        aplicaciones.push({
          Fecha: fert.fecha_aplicacion,
          Parcela: fert.parcel_name ?? parcelMap.get(fert.parcel_id ?? 0) ?? "—",
          Cultivo: fert.crop_variety ?? "—",
          Producto: fert.producto,
          Dosis: fert.dosis,
          Unidad: fert.unidad,
          Tipo: "Fertilizante",
          "Plazo de Seguridad (días)": "N/A",
        });
      }

      for (const pest of plagas) {
        if (parcelId && pest.parcel_id !== Number(parcelId)) continue;
        if (!isInDateRange(pest.fecha_deteccion, desde, hasta)) continue;
        if (!pest.tratamiento) continue;

        aplicaciones.push({
          Fecha: pest.fecha_deteccion,
          Parcela: pest.parcel_name ?? parcelMap.get(pest.parcel_id ?? 0) ?? "—",
          Cultivo: pest.crop_variety ?? "—",
          Producto: pest.tratamiento,
          Dosis: 0,
          Unidad: "—",
          Tipo: "Fitosanitario",
          "Plazo de Seguridad (días)": "—",
        });
      }

      // --- Sheet 2: Cosechas ---
      const cosechasSheet: CosechaRow[] = cosechas.map((h) => ({
        Fecha: h.fecha_cosecha,
        Parcela: h.parcel_name ?? parcelMap.get(h.parcel_id ?? 0) ?? "—",
        Cultivo: h.crop_variety ?? "—",
        Cantidad: h.cantidad,
        Unidad: h.unidad,
        "Rendimiento (kg/ha)": h.rendimiento ?? "—",
      }));

      // --- Sheet 3: Riegos ---
      const riegosSheet: RiegoRow[] = riegos.map((r) => ({
        Fecha: r.irrigation_date,
        Parcela: r.parcel_name ?? parcelMap.get(r.parcel_id ?? 0) ?? "—",
        Cultivo: r.crop_variety ?? "—",
        Método: formatMethod(r.method),
        "Cantidad (mm)": r.amount,
        "Duración (h)": r.duration ?? "—",
      }));

      // Build workbook
      const wb = XLSX.utils.book_new();

      // Header metadata info
      const fechaGen = new Date().toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      const headerInfo = [
        ["CUADERNO DE CAMPO — Gestión Agrícola"],
        [`Fecha de generación: ${fechaGen}`],
        [`Productor: ${productor}`],
        [desde || hasta ? `Período: ${desde || "—"} al ${hasta || "—"}` : "Período: Sin filtro de fechas"],
        [""],
      ];

      // Sheet 1: Aplicaciones
      const ws1 = XLSX.utils.json_to_sheet(aplicaciones, {
        header: [
          "Fecha",
          "Parcela",
          "Cultivo",
          "Producto",
          "Dosis",
          "Unidad",
          "Tipo",
          "Plazo de Seguridad (días)",
        ],
      });
      XLSX.utils.sheet_add_aoa(ws1, headerInfo, { origin: "A1" });
      XLSX.utils.book_append_sheet(wb, ws1, "Aplicaciones");

      // Sheet 2: Cosechas
      const ws2 = XLSX.utils.json_to_sheet(cosechasSheet, {
        header: [
          "Fecha",
          "Parcela",
          "Cultivo",
          "Cantidad",
          "Unidad",
          "Rendimiento (kg/ha)",
        ],
      });
      XLSX.utils.sheet_add_aoa(ws2, headerInfo, { origin: "A1" });
      XLSX.utils.book_append_sheet(wb, ws2, "Cosechas");

      // Sheet 3: Riegos
      const ws3 = XLSX.utils.json_to_sheet(riegosSheet, {
        header: [
          "Fecha",
          "Parcela",
          "Cultivo",
          "Método",
          "Cantidad (mm)",
          "Duración (h)",
        ],
      });
      XLSX.utils.sheet_add_aoa(ws3, headerInfo, { origin: "A1" });
      XLSX.utils.book_append_sheet(wb, ws3, "Riegos");

      // Download
      const filename = `cuaderno-campo-${desde || "todo"}-a-${hasta || "todo"}.xlsx`;
      XLSX.writeFile(wb, filename);
    } catch {
      setError("Error al generar el cuaderno de campo. Verifique que los datos estén disponibles.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-primary-dark">
        Cuaderno de Campo
      </h1>

      <p className="mb-6 text-sm text-muted-foreground">
        Genere un archivo Excel con toda la información legal requerida para
        trazabilidad agrícola. Incluye aplicaciones (fertilizantes y
        fitosanitarios), cosechas y riegos.
      </p>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-primary-dark">
              Desde
            </label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary-dark focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-primary-dark">
              Hasta
            </label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary-dark focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-primary-dark">
              Parcela
            </label>
            <select
              value={parcelId}
              onChange={(e) =>
                setParcelId(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary-dark focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Todas las parcelas</option>
              {parcels.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-destructive-light px-4 py-2 text-sm text-destructive-dark">
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="mt-6 flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ClipboardCheck className="h-5 w-5" />
          {generating ? "Generando..." : "Generar Cuaderno de Campo"}
        </button>
      </div>
    </div>
  );
}
