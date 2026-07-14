import { useEffect, useMemo } from "react";
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
import { BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { useParcelsStore } from "../../stores/parcels";
import { useCropsStore } from "../../stores/crops";
import { useHarvestsStore } from "../../stores/harvests";
import { useFertilizationsStore } from "../../stores/fertilizations";
import { usePestsStore } from "../../stores/pests";
import { StatCard } from "../../shared/components/StatCard";
import { EmptyState } from "../../shared/components/EmptyState";

const SEVERITY_COLORS: Record<string, string> = {
  baja: "#22c55e",
  media: "#f59e0b",
  alta: "#ef4444",
};

const SEVERITY_LABELS: Record<string, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
};

const CHART_COLORS = [
  "#15803D",
  "#22C55E",
  "#60a5fa",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];

function formatCurrency(value: number): string {
  return `$${value.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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

  useEffect(() => {
    fetchParcels();
    fetchCrops();
    fetchHarvs();
    fetchFerts();
    fetchPests();
  }, [fetchParcels, fetchCrops, fetchHarvs, fetchFerts, fetchPests]);

  const loading =
    loadingParcels || loadingCrops || loadingHarvs || loadingFerts || loadingPests;

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
    // Fertilization costs per crop
    const costByCrop = new Map<number, number>();
    for (const f of fertilizations) {
      costByCrop.set(f.crop_id, (costByCrop.get(f.crop_id) ?? 0) + (f.costo ?? 0));
    }

    // Harvest kg per crop
    const kgByCrop = new Map<number, number>();
    for (const h of harvests) {
      const kg = h.unidad === "ton" ? h.cantidad * 1000 : h.cantidad;
      kgByCrop.set(h.crop_id, (kgByCrop.get(h.crop_id) ?? 0) + kg);
    }

    // Vegetable keyword check (same heuristic as costs)
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
      .slice(0, 10); // top 10 for readability
  }, [fertilizations, harvests, crops]);

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
        <StatCard
          icon="🌾"
          value={parcels.length}
          label="Total parcelas"
          color="emerald"
          accent
        />
        <StatCard
          icon="🌱"
          value={cultivosActivos}
          label="Cultivos activos"
          color="indigo"
        />
        <StatCard
          icon="🌽"
          value={harvests.length}
          label="Cosechas totales"
          color="amber"
        />
        <StatCard
          icon="💰"
          value={totalInversion}
          label="Inversión total"
          color="blue"
        />
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
                formatter={(value: number) => [
                  `${value.toLocaleString("es-ES")} kg/ha`,
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
                formatter={(value: number) => [
                  formatCurrency(value),
                  undefined,
                ]}
              />
              <Legend />
              <Bar
                dataKey="costos"
                name="Costos"
                stackId="a"
                fill="#ef4444"
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
    </div>
  );
}
