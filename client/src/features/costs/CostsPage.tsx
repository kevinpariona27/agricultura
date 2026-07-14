import { useEffect, useMemo } from "react";
import { TrendingDown, TrendingUp, DollarSign, Award } from "lucide-react";
import { useCropsStore } from "../../stores/crops";
import { useFertilizationsStore } from "../../stores/fertilizations";
import { useHarvestsStore } from "../../stores/harvests";
import { useParcelsStore } from "../../stores/parcels";
import { CostsTable, buildCropCostRows } from "./components/CostsTable";

function formatCurrency(value: number): string {
  return `$${value.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function CostsPage() {
  const { crops, fetchAll: fetchCrops, loading: loadingCrops } =
    useCropsStore();
  const {
    fertilizations,
    fetchAll: fetchFerts,
    loading: loadingFerts,
  } = useFertilizationsStore();
  const { harvests, fetchAll: fetchHarvs, loading: loadingHarvs } =
    useHarvestsStore();
  const { parcels, fetchAll: fetchParcels, loading: loadingParcels } =
    useParcelsStore();

  useEffect(() => {
    fetchCrops();
    fetchFerts();
    fetchHarvs();
    fetchParcels();
  }, [fetchCrops, fetchFerts, fetchHarvs, fetchParcels]);

  const loading = loadingCrops || loadingFerts || loadingHarvs || loadingParcels;

  const rows = useMemo(
    () => buildCropCostRows(crops, fertilizations, harvests, parcels),
    [crops, fertilizations, harvests, parcels]
  );

  // Summary calculations
  const totalInvested = useMemo(
    () => rows.reduce((sum, r) => sum + r.totalFertilizationCost, 0),
    [rows]
  );

  const averageMargin = useMemo(() => {
    if (rows.length === 0) return 0;
    return rows.reduce((sum, r) => sum + r.margin, 0) / rows.length;
  }, [rows]);

  const bestCrop = useMemo(() => {
    if (rows.length === 0) return null;
    return rows.reduce((best, r) => (r.margin > best.margin ? r : best), rows[0]);
  }, [rows]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-12 text-center text-muted-foreground">
        Cargando...
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-primary-dark">
        Costos por Cultivo
      </h1>

      {/* Summary cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Total invested */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total invertido en fertilizaciones
              </p>
              <p className="mt-1 text-3xl font-bold text-primary-dark">
                {formatCurrency(totalInvested)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-primary" />
          </div>
        </div>

        {/* Average margin */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Margen promedio
              </p>
              <p
                className={`mt-1 text-3xl font-bold ${
                  averageMargin >= 0 ? "text-primary-dark" : "text-destructive"
                }`}
              >
                {formatCurrency(averageMargin)}
              </p>
            </div>
            {averageMargin >= 0 ? (
              <TrendingUp className="h-8 w-8 text-primary" />
            ) : (
              <TrendingDown className="h-8 w-8 text-destructive" />
            )}
          </div>
        </div>

        {/* Best crop */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Cultivo más rentable
              </p>
              <p className="mt-1 text-3xl font-bold text-primary-dark">
                {bestCrop ? bestCrop.variety : "—"}
              </p>
              {bestCrop && (
                <p className="mt-0.5 text-sm text-primary">
                  {formatCurrency(bestCrop.margin)}
                </p>
              )}
            </div>
            <Award className="h-8 w-8 text-primary" />
          </div>
        </div>
      </div>

      {/* Data table */}
      <h2 className="mb-3 text-lg font-medium tracking-tight text-primary-dark/90">
        Desglose por cultivo
      </h2>
      <CostsTable rows={rows} />
    </div>
  );
}
