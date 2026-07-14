import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { BarChart3, PieChart as PieChartIcon, Wheat, Sprout, Pizza, DollarSign } from "lucide-react";
import { useParcelsStore } from "../../stores/parcels";
import { useCropsStore } from "../../stores/crops";
import { useHarvestsStore } from "../../stores/harvests";
import { useFertilizationsStore } from "../../stores/fertilizations";
import { usePestsStore } from "../../stores/pests";
import { StatCard } from "../../shared/components/StatCard";
import { EmptyState } from "../../shared/components/EmptyState";

const SEVERITY_COLORS: Record<string, string> = {
  baja: "#22C55E",
  media: "#D4A017",
  alta: "#B45309",
};

const SEVERITY_LABELS: Record<string, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
};

function formatCurrency(value: number): string {
  return `$${value.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Get unique years from harvest dates */
function getAvailableYears(harvestDates: string[]): number[] {
  const years = new Set<number>();
  for (const d of harvestDates) {
    const y = new Date(d + "T00:00:00").getFullYear();
    if (!isNaN(y)) years.add(y);
  }
  return Array.from(years).sort();
}

export function ReportsPage() {
  const { parcels, fetchAll: fetchParcels, loading: loadingParcels } =
    useParcelsStore();
  const { crops, fetchAll: fetchCrops, loading: loadingCrops } =
    useCropsStore();
  const { harvests, fetchAll: fetchHarvs, loading: loadingHarvs } =
    useHarvestsStore();
  const {
    fertilizations,
    fetchAll: fetchFerts,
    loading: loadingFerts,
  } = useFertilizationsStore();
  const { pests, fetchAll: fetchPests, loading: loadingPests } =
    usePestsStore();

  // Year selector state
  const [compareYearA, setCompareYearA] = useState<number | null>(null);
  const [compareYearB, setCompareYearB] = useState<number | null>(null);

  useEffect(() => {
    fetchParcels();
    fetchCrops();
    fetchHarvs();
    fetchFerts();
    fetchPests();
  }, [fetchParcels, fetchCrops, fetchHarvs, fetchFerts, fetchPests]);

  const loading =
    loadingParcels || loadingCrops || loadingHarvs || loadingFerts || loadingPests;

  // Available years
  const availableYears = useMemo(
    () => getAvailableYears(harvests.map((h) => h.fecha_cosecha)),
    [harvests]
  );

  // Auto-select first two years
  useEffect(() => {
    if (availableYears.length >= 2) {
      if (compareYearA === null) setCompareYearA(availableYears[0]);
      if (compareYearB === null) setCompareYearB(availableYears[1]);
    } else if (availableYears.length === 1) {
      if (compareYearA === null) setCompareYearA(availableYears[0]);
    }
  }, [availableYears, compareYearA, compareYearB]);

  // --- Section 1: Summary stats ---
  const cultivosActivos = useMemo(
    () =>
      crops.filter(
        (c) => c.status !== "cosechado" && c.status !== "cancelado"
      ).length,
    [crops]
  );

  const totalInversion = useMemo(
    () => fertilizations.reduce((sum, f) => sum + (f.costo ?? 0), 0),
    [fertilizations]
  );

  // --- Section 2: Rendimiento por Cultivo ---
  const yieldByCrop = useMemo(() => {
    const grouped = new Map<
      number,
      { name: string; total: number; count: number }
    >();
    for (const h of harvests) {
      if (h.rendimiento == null) continue;
      const crop = crops.find((c) => c.id === h.crop_id);
      const cropName = crop?.variety ?? `Cultivo #${h.crop_id}`;
      const prev = grouped.get(h.crop_id) ?? { name: cropName, total: 0, count: 0 };
      prev.total += h.rendimiento;
      prev.count += 1;
      grouped.set(h.crop_id, prev);
    }
    return Array.from(grouped.values())
      .map((g) => ({
        name: g.name,
        rendimiento: Math.round(g.total / g.count),
      }))
      .sort((a, b) => b.rendimiento - a.rendimiento);
  }, [harvests, crops]);

  // --- Section 3: Costos vs Ingresos ---
  const costsVsRevenue = useMemo(() => {
    const costByCrop = new Map<number, number>();
    for (const f of fertilizations) {
      costByCrop.set(f.crop_id, (costByCrop.get(f.crop_id) ?? 0) + (f.costo ?? 0));
    }

    const kgByCrop = new Map<number, number>();
    for (const h of harvests) {
      const kg = h.unidad === "ton" ? h.cantidad * 1000 : h.cantidad;
      kgByCrop.set(h.crop_id, (kgByCrop.get(h.crop_id) ?? 0) + kg);
    }

    const vegetableKeywords = [
      "tomate", "lechuga", "zanahoria", "cebolla", "pimiento",
      "brocoli", "coliflor", "espinaca", "acelga", "berenjena",
      "calabaza", "zapallo", "pepino", "remolacha", "apio",
      "papa", "batata", "ajo", "chaucha", "arveja",
    ];

    const allCropIds = new Set([
      ...costByCrop.keys(),
      ...kgByCrop.keys(),
    ]);

    return Array.from(allCropIds)
      .map((cropId) => {
        const crop = crops.find((c) => c.id === cropId);
        const name = crop?.variety ?? `Cultivo #${cropId}`;
        const isVeg = crop
          ? vegetableKeywords.some((kw) => crop.variety.toLowerCase().includes(kw))
          : false;
        const pricePerKg = isVeg ? 1.0 : 0.5;
        return {
          name,
          costos: costByCrop.get(cropId) ?? 0,
          ingresos: Math.round((kgByCrop.get(cropId) ?? 0) * pricePerKg),
        };
      })
      .sort((a, b) => b.costos + b.ingresos - (a.costos + a.ingresos))
      .slice(0, 10);
  }, [fertilizations, harvests, crops]);

  // --- Section 5: Comparativa de Rendimiento entre Campañas ---
  const HARVEST_COLORS = [
    "#15803D",
    "#D4A017",
    "#B8860B",
    "#22C55E",
    "#8B6914",
    "#C4953A",
    "#0F2E1A",
    "#A16207",
  ];

  const yieldComparison = useMemo(() => {
    const byVariety = new Map<
      string,
      { crop_id: number; fecha_cosecha: string; rendimiento: number }[]
    >();

    for (const h of harvests) {
      if (h.rendimiento == null) continue;
      const crop = crops.find((c) => c.id === h.crop_id);
      const variety = crop?.variety ?? `Cultivo #${h.crop_id}`;
      const entry = byVariety.get(variety) ?? [];
      entry.push({
        crop_id: h.crop_id,
        fecha_cosecha: h.fecha_cosecha,
        rendimiento: h.rendimiento,
      });
      byVariety.set(variety, entry);
    }

    const allDates = Array.from(
      new Set(harvests.filter((h) => h.rendimiento != null).map((h) => h.fecha_cosecha)),
    ).sort();

    return Array.from(byVariety.entries()).map(([variety, entries]) => {
      const row: Record<string, string | number> = { name: variety };
      for (const date of allDates) {
        const match = entries.find((e) => e.fecha_cosecha === date);
        row[date] = match ? match.rendimiento : 0;
      }
      return row;
    });
  }, [harvests, crops]);

  const comparisonDates = useMemo(() => {
    return Array.from(
      new Set(harvests.filter((h) => h.rendimiento != null).map((h) => h.fecha_cosecha)),
    ).sort();
  }, [harvests]);

  // --- Enhanced: Year-based comparison ---
  const yearComparisonData = useMemo(() => {
    if (compareYearA === null || compareYearB === null) return [];

    const cropYieldByYear = new Map<
      string,
      { yearA: number; yearB: number }
    >();

    for (const h of harvests) {
      if (h.rendimiento == null) continue;
      const year = new Date(h.fecha_cosecha + "T00:00:00").getFullYear();
      if (year !== compareYearA && year !== compareYearB) continue;

      const crop = crops.find((c) => c.id === h.crop_id);
      const name = crop?.variety ?? `Cultivo #${h.crop_id}`;

      const prev = cropYieldByYear.get(name) ?? { yearA: 0, yearB: 0 };
      if (year === compareYearA) {
        prev.yearA = Math.max(prev.yearA, h.rendimiento);
      } else {
        prev.yearB = Math.max(prev.yearB, h.rendimiento);
      }
      cropYieldByYear.set(name, prev);
    }

    return Array.from(cropYieldByYear.entries()).map(([name, data]) => ({
      name,
      [`${compareYearA}`]: data.yearA,
      [`${compareYearB}`]: data.yearB,
    }));
  }, [harvests, crops, compareYearA, compareYearB]);

  // --- Section 4: Distribución de Plagas ---
  const pestDistribution = useMemo(() => {
    const bySeveridad = new Map<string, number>();
    for (const p of pests) {
      bySeveridad.set(p.severidad, (bySeveridad.get(p.severidad) ?? 0) + 1);
    }
    return Array.from(bySeveridad.entries()).map(([severidad, count]) => ({
      name: SEVERITY_LABELS[severidad] ?? severidad,
      value: count,
      fill: SEVERITY_COLORS[severidad] ?? "#6b7280",
    }));
  }, [pests]);

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
        Reportes
      </h1>

      {/* Section 1: Resumen General */}
      <h2 className="mb-4 text-lg font-medium tracking-tight text-primary-dark/90">
        Resumen General
      </h2>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Wheat} value={parcels.length} label="Total parcelas" color="emerald" accent />
        <StatCard icon={Sprout} value={cultivosActivos} label="Cultivos activos" color="indigo" />
        <StatCard icon={Pizza} value={harvests.length} label="Cosechas totales" color="amber" />
        <StatCard icon={DollarSign} value={totalInversion} label="Inversión total" color="blue" />
      </div>

      {/* Section 2: Rendimiento por Cultivo */}
      <div className="mb-8 rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-base font-semibold text-primary-dark">
          Rendimiento por Cultivo (kg/ha)
        </h2>
        {yieldByCrop.length === 0 ? (
          <EmptyState
            IconComponent={BarChart3}
            message="No hay datos de rendimiento registrados."
          />
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={yieldByCrop}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />
              <Tooltip
                formatter={(value) => [
                  `${Number(value).toLocaleString("es-ES")} kg/ha`,
                  "Rendimiento",
                ]}
              />
              <Legend />
              <Bar
                dataKey="rendimiento"
                name="Rendimiento (kg/ha)"
                fill="#15803D"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Section 3: Costos vs Ingresos */}
      <div className="mb-8 rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-base font-semibold text-primary-dark">
          Costos vs Ingresos por Cultivo
        </h2>
        {costsVsRevenue.length === 0 ? (
          <EmptyState
            IconComponent={BarChart3}
            message="No hay datos de costos o ingresos registrados."
          />
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={costsVsRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />
              <Tooltip
                formatter={(value) => [
                  formatCurrency(Number(value)),
                  undefined,
                ]}
              />
              <Legend />
              <Bar
                dataKey="costos"
                name="Costos"
                stackId="a"
                fill="#D4A017"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="ingresos"
                name="Ingresos estimados"
                stackId="a"
                fill="#22C55E"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Section 4: Distribución de Plagas */}
      <div className="mb-8 rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-base font-semibold text-primary-dark">
          Distribución de Plagas por Severidad
        </h2>
        {pestDistribution.length === 0 ? (
          <EmptyState
            IconComponent={PieChartIcon}
            message="No hay plagas registradas."
          />
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={pestDistribution}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {pestDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Section 5: Comparativa de Rendimiento entre Campañas */}
      <div className="mb-8 rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-base font-semibold text-primary-dark">
          Comparativa de Rendimiento entre Campañas
        </h2>

        {/* Year selector for enhanced comparison */}
        {availableYears.length >= 2 && (
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">Año A:</label>
              <select
                value={compareYearA ?? ""}
                onChange={(e) => setCompareYearA(Number(e.target.value))}
                className="rounded-lg border border-border bg-app-bg px-3 py-1.5 text-sm text-primary-dark focus:border-primary focus:outline-none"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-sm font-bold text-muted-foreground">vs</span>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">Año B:</label>
              <select
                value={compareYearB ?? ""}
                onChange={(e) => setCompareYearB(Number(e.target.value))}
                className="rounded-lg border border-border bg-app-bg px-3 py-1.5 text-sm text-primary-dark focus:border-primary focus:outline-none"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Year comparison bar chart */}
        {yearComparisonData.length > 0 && compareYearA && compareYearB ? (
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
              Rendimiento {compareYearA} vs {compareYearB} por cultivo (kg/ha)
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={yearComparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />
                <Tooltip
                  formatter={(value) => [
                    `${Number(value).toLocaleString("es-ES")} kg/ha`,
                    undefined,
                  ]}
                />
                <Legend />
                <Bar
                  dataKey={`${compareYearA}`}
                  name={`${compareYearA}`}
                  fill="#15803D"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey={`${compareYearB}`}
                  name={`${compareYearB}`}
                  fill="#D4A017"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mb-6 rounded-xl border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
            Selecciona dos años con cosechas para comparar el rendimiento por cultivo.
          </div>
        )}

        {/* Original date-based comparison (existing) */}
        {yieldComparison.length > 0 && comparisonDates.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={yieldComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />
              <Tooltip
                formatter={(value) => [
                  `${Number(value).toLocaleString("es-ES")} kg/ha`,
                  undefined,
                ]}
                labelFormatter={(label) => `Cultivo: ${label}`}
              />
              <Legend
                formatter={(value) =>
                  new Date(value).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                    year: "2-digit",
                  })
                }
              />
              {comparisonDates.map((date, idx) => (
                <Bar
                  key={date}
                  dataKey={date}
                  name={date}
                  fill={HARVEST_COLORS[idx % HARVEST_COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : null}
      </div>
    </div>
  );
}
