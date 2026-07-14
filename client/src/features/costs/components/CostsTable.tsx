import { useMemo } from "react";
import type { Crop, Fertilization, Harvest, Parcel } from "@agri/shared";

export interface CropCostRow {
  cropId: number;
  variety: string;
  parcelName: string;
  status: string;
  totalFertilizationCost: number;
  rendimiento: number | null;
  estimatedIncome: number;
  margin: number;
}

interface CostsTableProps {
  rows: CropCostRow[];
}

const CROP_STATUS_LABELS: Record<string, string> = {
  planificado: "Planificado",
  en_crecimiento: "En crecimiento",
  floracion: "Floración",
  en_cosecha: "En cosecha",
  cosechado: "Cosechado",
  cancelado: "Cancelado",
};

function formatCurrency(value: number): string {
  return `$${value.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function CostsTable({ rows }: CostsTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
        No hay datos de costos disponibles.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full text-left text-sm min-w-[800px]">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Cultivo</th>
            <th className="px-4 py-3 font-medium">Parcela</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium text-right">Costo fertilizantes</th>
            <th className="px-4 py-3 font-medium text-right">Rendimiento (kg/ha)</th>
            <th className="px-4 py-3 font-medium text-right">Ingreso estimado</th>
            <th className="px-4 py-3 font-medium text-right">Margen</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.cropId} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3 font-medium text-primary-dark">
                {row.variety}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {row.parcelName}
              </td>
              <td className="px-4 py-3">
                <span className="inline-block rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-dark">
                  {CROP_STATUS_LABELS[row.status] ?? row.status}
                </span>
              </td>
              <td className="px-4 py-3 text-right text-muted-foreground">
                {formatCurrency(row.totalFertilizationCost)}
              </td>
              <td className="px-4 py-3 text-right text-muted-foreground">
                {row.rendimiento != null
                  ? row.rendimiento.toLocaleString("es-ES")
                  : "—"}
              </td>
              <td className="px-4 py-3 text-right text-muted-foreground">
                {formatCurrency(row.estimatedIncome)}
              </td>
              <td className="px-4 py-3 text-right">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    row.margin >= 0
                      ? "bg-primary-50 text-primary-dark"
                      : "bg-destructive-light text-destructive-dark"
                  }`}
                >
                  {formatCurrency(row.margin)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Builds cost rows from raw store data.
 * Exported so CostsPage can use it without duplicating logic.
 */
export function buildCropCostRows(
  crops: Crop[],
  fertilizations: Fertilization[],
  harvests: Harvest[],
  parcels: Parcel[]
): CropCostRow[] {
  const parcelMap = new Map(parcels.map((p) => [p.id, p.name]));

  // Classify crop as vegetable or grain for pricing
  const vegetableKeywords = [
    "tomate", "lechuga", "zanahoria", "cebolla", "pimiento",
    "brocoli", "coliflor", "espinaca", "acelga", "berenjena",
    "calabaza", "zapallo", "pepino", "remolacha", "apio",
    "papa", "batata", "ajo", "chaucha", "arveja",
  ];

  function isVegetable(variety: string): boolean {
    const lower = variety.toLowerCase();
    return vegetableKeywords.some((kw) => lower.includes(kw));
  }

  // Sum fertilization costs per crop
  const fertCostByCrop = new Map<number, number>();
  for (const f of fertilizations) {
    const prev = fertCostByCrop.get(f.crop_id) ?? 0;
    fertCostByCrop.set(f.crop_id, prev + (f.costo ?? 0));
  }

  // Sum harvests data per crop: total cantidad in kg, latest rendimiento
  const harvestByCrop = new Map<
    number,
    { totalKg: number; rendimiento: number | null }
  >();
  for (const h of harvests) {
    const prev = harvestByCrop.get(h.crop_id) ?? { totalKg: 0, rendimiento: null };
    // Convert cantidad to kg
    let kg: number;
    if (h.unidad === "ton") {
      kg = h.cantidad * 1000;
    } else {
      kg = h.cantidad;
    }
    harvestByCrop.set(h.crop_id, {
      totalKg: prev.totalKg + kg,
      // Use the most recent harvest's rendimiento (overwrites as we iterate)
      rendimiento: h.rendimiento ?? prev.rendimiento,
    });
  }

  return crops.map((crop) => {
    const fertCost = fertCostByCrop.get(crop.id) ?? 0;
    const harvestData = harvestByCrop.get(crop.id);
    const totalKg = harvestData?.totalKg ?? 0;
    const rendimiento = harvestData?.rendimiento ?? null;

    const pricePerKg = isVegetable(crop.variety) ? 1.0 : 0.5;
    const estimatedIncome = totalKg * pricePerKg;
    const margin = estimatedIncome - fertCost;

    return {
      cropId: crop.id,
      variety: crop.variety,
      parcelName: parcelMap.get(crop.parcel_id) ?? `Parcela #${crop.parcel_id}`,
      status: crop.status,
      totalFertilizationCost: fertCost,
      rendimiento,
      estimatedIncome,
      margin,
    };
  });
}
