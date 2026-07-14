import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useParcelsStore } from "../../stores/parcels";
import { useCropsStore } from "../../stores/crops";
import { useIrrigationsStore } from "../../stores/irrigations";
import { usePestsStore } from "../../stores/pests";
import { useHarvestsStore } from "../../stores/harvests";
import { useInventoryStore } from "../../stores/inventory";
import { useFertilizationsStore } from "../../stores/fertilizations";
import { useWeatherStore } from "../../stores/weather";
import { useNotificationStore } from "../../stores/notificationStore";
import { StatCard } from "../../shared/components/StatCard";
import {
  Wheat,
  Sprout,
  Droplets,
  Bug,
  Pizza,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Award,
  Cloud,
  CloudRain,
  Wind,
  Thermometer,
  Calendar as CalendarIcon,
} from "lucide-react";
import { DonutChart } from "./components/DonutChart";
import { EvolutionBarChart } from "./components/EvolutionBarChart";
import { EmptyState } from "../../shared/components/EmptyState";
import { BarChart3 } from "lucide-react";
import { buildCropCostRows } from "../costs/components/CostsTable";

type TabKey = "general" | "financiero" | "operativo";

const TABS: { key: TabKey; label: string }[] = [
  { key: "general", label: "General" },
  { key: "financiero", label: "Financiero" },
  { key: "operativo", label: "Operativo" },
];

function formatCurrency(value: number): string {
  return `$${value.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Format a date string to a readable Spanish date */
function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function WeatherWidget() {
  const { weather, fetchWeather } = useWeatherStore();

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  if (!weather.loaded) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-4">
        <p className="text-xs text-muted-foreground">Cargando clima...</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <Cloud className="h-4 w-4 text-blue-500" />
        <span className="text-xs font-medium text-muted-foreground">
          {weather.city}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <img
          src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
          alt={weather.condition}
          className="h-12 w-12"
        />
        <div>
          <p className="text-2xl font-bold text-primary-dark">
            {weather.temp}°C
          </p>
          <p className="text-xs capitalize text-muted-foreground">
            {weather.condition}
          </p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3">
        <div className="text-center">
          <Thermometer className="mx-auto h-3.5 w-3.5 text-orange-500" />
          <p className="mt-0.5 text-xs font-medium text-primary-dark">
            {weather.feels_like}°C
          </p>
          <p className="text-[10px] text-muted-foreground">Sensación</p>
        </div>
        <div className="text-center">
          <CloudRain className="mx-auto h-3.5 w-3.5 text-blue-500" />
          <p className="mt-0.5 text-xs font-medium text-primary-dark">
            {weather.humidity}%
          </p>
          <p className="text-[10px] text-muted-foreground">Humedad</p>
        </div>
        <div className="text-center">
          <Wind className="mx-auto h-3.5 w-3.5 text-teal-500" />
          <p className="mt-0.5 text-xs font-medium text-primary-dark">
            {weather.wind_speed}
          </p>
          <p className="text-[10px] text-muted-foreground">km/h</p>
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("general");

  const { parcels, fetchAll: fetchParcels, loading: loadingParcels } =
    useParcelsStore();
  const { crops, fetchAll: fetchCrops, loading: loadingCrops } =
    useCropsStore();
  const { irrigations, fetchAll: fetchIrrigations, loading: loadingIrrig } =
    useIrrigationsStore();
  const { pests, fetchAll: fetchPests, loading: loadingPests } =
    usePestsStore();
  const { harvests, fetchAll: fetchHarvests, loading: loadingHarv } =
    useHarvestsStore();
  const { items, fetchAll: fetchInventory, loading: loadingInv } =
    useInventoryStore();
  const {
    fertilizations,
    fetchAll: fetchFerts,
    loading: loadingFerts,
  } = useFertilizationsStore();
  const computeNotifications = useNotificationStore(
    (s) => s.computeNotifications
  );

  useEffect(() => {
    fetchParcels();
    fetchCrops();
    fetchIrrigations();
    fetchPests({ estado: "activo" });
    fetchHarvests();
    fetchInventory();
    fetchFerts();
  }, [
    fetchParcels,
    fetchCrops,
    fetchIrrigations,
    fetchPests,
    fetchHarvests,
    fetchInventory,
    fetchFerts,
  ]);

  // Compute real-time notifications after data loads
  useEffect(() => {
    if (
      !loadingParcels &&
      !loadingCrops &&
      !loadingIrrig &&
      !loadingPests &&
      !loadingHarv &&
      !loadingInv &&
      !loadingFerts
    ) {
      computeNotifications();
    }
  }, [
    crops,
    parcels,
    irrigations,
    pests,
    harvests,
    items,
    fertilizations,
    loadingParcels,
    loadingCrops,
    loadingIrrig,
    loadingPests,
    loadingHarv,
    loadingInv,
    loadingFerts,
    computeNotifications,
  ]);

  const loading =
    loadingParcels ||
    loadingCrops ||
    loadingIrrig ||
    loadingPests ||
    loadingHarv ||
    loadingInv ||
    loadingFerts;

  // ====== General Tab Metrics ======

  const cultivosActivos = useMemo(
    () =>
      crops.filter(
        (c) => c.status !== "cosechado" && c.status !== "cancelado"
      ).length,
    [crops]
  );

  const riegosEsteMes = useMemo(() => {
    const now = new Date();
    return irrigations.filter((i) => {
      const d = new Date(i.irrigation_date);
      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }).length;
  }, [irrigations]);

  const plagasActivas = useMemo(
    () => pests.filter((p) => p.estado === "activo").length,
    [pests]
  );

  const inventarioCritico = useMemo(
    () => items.filter((i) => i.cantidad <= 5).length,
    [items]
  );

  const expiringItems = useMemo(() => {
    if (!items.length) return [];
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return items
      .filter((item) => {
        if (!item.fecha_vencimiento) return false;
        const venc = new Date(item.fecha_vencimiento);
        return venc <= thirtyDaysFromNow;
      })
      .sort(
        (a, b) =>
          new Date(a.fecha_vencimiento!).getTime() -
          new Date(b.fecha_vencimiento!).getTime()
      );
  }, [items]);

  const lowStockItems = useMemo(() => {
    return items.filter((item) => item.cantidad <= 5);
  }, [items]);

  // Top Rendimiento — top 5 crops by yield
  const topYield = useMemo(() => {
    const grouped = new Map<
      number,
      { name: string; total: number; count: number }
    >();
    for (const h of harvests) {
      if (h.rendimiento == null) continue;
      const crop = crops.find((c) => c.id === h.crop_id);
      const fullName = crop?.variety ?? `Cultivo #${h.crop_id}`;
      const cropName =
        fullName.length > 15 ? fullName.slice(0, 15) + "…" : fullName;
      const prev = grouped.get(h.crop_id) ?? {
        name: cropName,
        total: 0,
        count: 0,
      };
      prev.total += h.rendimiento;
      prev.count += 1;
      grouped.set(h.crop_id, prev);
    }
    return Array.from(grouped.values())
      .map((g) => ({
        name: g.name,
        rendimiento: Math.round(g.total / g.count),
      }))
      .sort((a, b) => b.rendimiento - a.rendimiento)
      .slice(0, 5);
  }, [harvests, crops]);

  // ====== Financiero Tab ======
  const costRows = useMemo(
    () => buildCropCostRows(crops, fertilizations, harvests, parcels),
    [crops, fertilizations, harvests, parcels]
  );

  const totalInvested = useMemo(
    () => costRows.reduce((sum, r) => sum + r.totalFertilizationCost, 0),
    [costRows]
  );

  const averageMargin = useMemo(() => {
    if (costRows.length === 0) return 0;
    return (
      costRows.reduce((sum, r) => sum + r.margin, 0) / costRows.length
    );
  }, [costRows]);

  const bestCrop = useMemo(() => {
    if (costRows.length === 0) return null;
    return costRows.reduce(
      (best, r) => (r.margin > best.margin ? r : best),
      costRows[0]
    );
  }, [costRows]);

  // Margin per kg calculation
  const avgMarginPerKg = useMemo(() => {
    // Sum harvest kg per crop
    const kgByCrop = new Map<number, number>();
    for (const h of harvests) {
      const kg = h.unidad === "ton" ? h.cantidad * 1000 : h.cantidad;
      kgByCrop.set(h.crop_id, (kgByCrop.get(h.crop_id) ?? 0) + kg);
    }

    const marginPerKgRows = costRows.map((r) => {
      const totalKg = kgByCrop.get(r.cropId) ?? 0;
      const mkg = totalKg > 0 ? r.margin / totalKg : 0;
      return { ...r, totalKg, marginPerKg: mkg };
    });

    const totalMargin = marginPerKgRows.reduce((sum, r) => sum + r.margin, 0);
    const totalKg = marginPerKgRows.reduce((sum, r) => sum + r.totalKg, 0);

    return {
      value: totalKg > 0 ? totalMargin / totalKg : 0,
      rows: marginPerKgRows,
    };
  }, [costRows, harvests]);

  // ====== Operativo Tab ======
  const upcomingIrrigations = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return irrigations
      .filter((i) => {
        const d = new Date(i.irrigation_date + "T00:00:00");
        return d >= today;
      })
      .sort(
        (a, b) =>
          new Date(a.irrigation_date).getTime() -
          new Date(b.irrigation_date).getTime()
      )
      .slice(0, 5);
  }, [irrigations]);

  const upcomingHarvests = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return crops
      .filter((c) => {
        if (!c.estimated_harvest_date) return false;
        if (c.status === "cosechado" || c.status === "cancelado") return false;
        const d = new Date(c.estimated_harvest_date + "T00:00:00");
        return d >= today;
      })
      .sort(
        (a, b) =>
          new Date(a.estimated_harvest_date!).getTime() -
          new Date(b.estimated_harvest_date!).getTime()
      )
      .slice(0, 5);
  }, [crops]);

  const pendingFertilizations = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return fertilizations
      .filter((f) => {
        const d = new Date(f.fecha_aplicacion + "T00:00:00");
        return d >= today;
      })
      .sort(
        (a, b) =>
          new Date(a.fecha_aplicacion).getTime() -
          new Date(b.fecha_aplicacion).getTime()
      )
      .slice(0, 5);
  }, [fertilizations]);

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
        Dashboard
      </h1>

      {/* Tab Navigation */}
      <div className="mb-6 flex border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-primary-dark"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ================================================================ */}
      {/* TAB: General */}
      {/* ================================================================ */}
      {activeTab === "general" && (
        <>
          {/* Resumen rápido */}
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start">
            <div className="flex-1 flex items-center gap-3 rounded-2xl border border-accent bg-accent-light px-5 py-4 text-sm text-accent-dark">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <span>
                Hoy: <strong>{riegosEsteMes}</strong> riegos este mes,{" "}
                <strong>{plagasActivas}</strong> plagas activas,{" "}
                <strong>{inventarioCritico}</strong> items con stock crítico
              </span>
            </div>
            {/* Weather Widget */}
            <div className="lg:w-56">
              <WeatherWidget />
            </div>
          </div>

          {/* Stats grid */}
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatCard
              icon={Wheat}
              value={parcels.length}
              label="Parcelas"
              color="emerald"
              accent={true}
              onClick={() => navigate("/parcels")}
            />
            <StatCard
              icon={Sprout}
              value={cultivosActivos}
              label="Cultivos activos"
              color="indigo"
              onClick={() => navigate("/crops")}
            />
            <StatCard
              icon={Droplets}
              value={riegosEsteMes}
              label="Riegos este mes"
              color="blue"
              onClick={() => navigate("/irrigations")}
            />
            <StatCard
              icon={Bug}
              value={plagasActivas}
              label="Plagas activas"
              color="red"
              onClick={() => navigate("/pests")}
            />
            <StatCard
              icon={Pizza}
              value={harvests.length}
              label="Cosechas totales"
              color="amber"
              onClick={() => navigate("/harvests")}
            />
            <StatCard
              icon={Package}
              value={inventarioCritico}
              label="Inventario crítico"
              color="purple"
              onClick={() => navigate("/inventory")}
            />
          </div>

          {/* Charts grid */}
          <div
            className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3"
            data-testid="dashboard-charts"
          >
            {/* Donut chart — crop distribution */}
            <div className="rounded-2xl border border-border bg-surface p-6 lg:col-span-1">
              <h2 className="mb-4 text-base font-semibold text-primary-dark">
                Distribución de Cultivos
              </h2>
              <DonutChart />
            </div>

            {/* Bar chart — irrigation / harvest evolution */}
            <div className="rounded-2xl border border-border bg-surface p-6 lg:col-span-2">
              <h2 className="mb-4 text-base font-semibold text-primary-dark">
                Evolución Riegos / Cosechas
              </h2>
              <EvolutionBarChart />
            </div>
          </div>

          {/* Top Rendimiento */}
          <div className="mb-8 rounded-2xl border border-border bg-surface p-6">
            <h2 className="mb-4 text-base font-semibold text-primary-dark">
              Top Rendimiento (kg/ha)
            </h2>
            {topYield.length === 0 ? (
              <EmptyState
                IconComponent={BarChart3}
                message="No hay datos de rendimiento registrados."
              />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topYield} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    width={150}
                  />
                  <Tooltip
                    formatter={(value) => [
                      `${Number(value).toLocaleString("es-ES")} kg/ha`,
                      "Rendimiento",
                    ]}
                  />
                  <Bar
                    dataKey="rendimiento"
                    fill="#15803D"
                    radius={[0, 4, 4, 0]}
                    barSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Próximos vencimientos */}
          <div className="mb-6">
            <h2 className="mb-3 text-lg font-medium tracking-tight text-primary-dark/90">
              Próximos vencimientos
            </h2>
            {expiringItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                No hay insumos próximos a vencer.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
                <table className="w-full text-left text-sm min-w-[600px]">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Insumo</th>
                      <th className="px-4 py-3 font-medium">Categoría</th>
                      <th className="px-4 py-3 font-medium">Cantidad</th>
                      <th className="px-4 py-3 font-medium">Vencimiento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {expiringItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 font-medium text-primary-dark">
                          {item.nombre}
                        </td>
                        <td className="px-4 py-3 capitalize text-muted-foreground">
                          {item.categoria}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {item.cantidad} {item.unidad}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block rounded-full bg-destructive-light px-2 py-0.5 text-xs font-medium text-destructive-dark">
                            {new Date(
                              item.fecha_vencimiento!
                            ).toLocaleDateString("es-ES")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Stock bajo */}
          {lowStockItems.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-medium tracking-tight text-primary-dark/90">
                Stock bajo (≤ 5 unidades)
              </h2>
              <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
                <table className="w-full text-left text-sm min-w-[600px]">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Insumo</th>
                      <th className="px-4 py-3 font-medium">Cantidad</th>
                      <th className="px-4 py-3 font-medium">Unidad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {lowStockItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 font-medium text-primary-dark">
                          {item.nombre}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                            {item.cantidad}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {item.unidad}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ================================================================ */}
      {/* TAB: Financiero */}
      {/* ================================================================ */}
      {activeTab === "financiero" && (
        <>
          {/* Summary cards */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total invested */}
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total invertido
                  </p>
                  <p className="mt-1 text-2xl font-bold text-primary-dark">
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
                    className={`mt-1 text-2xl font-bold ${
                      averageMargin >= 0
                        ? "text-primary-dark"
                        : "text-destructive"
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
                  <p className="mt-1 text-2xl font-bold text-primary-dark">
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

            {/* Margin per kg */}
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Margen promedio
                  </p>
                  <p
                    className={`mt-1 text-2xl font-bold ${
                      avgMarginPerKg.value >= 0
                        ? "text-primary"
                        : "text-destructive"
                    }`}
                  >
                    ${avgMarginPerKg.value.toFixed(2)}/kg
                  </p>
                </div>
                {avgMarginPerKg.value >= 0 ? (
                  <TrendingUp className="h-8 w-8 text-primary" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-destructive" />
                )}
              </div>
            </div>
          </div>

          {/* Cost table with margin per kg */}
          <h2 className="mb-3 text-lg font-medium tracking-tight text-primary-dark/90">
            Desglose por cultivo
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
            <table className="w-full text-left text-sm min-w-[900px]">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Cultivo</th>
                  <th className="px-4 py-3 font-medium">Parcela</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium text-right">
                    Costo fert.
                  </th>
                  <th className="px-4 py-3 font-medium text-right">
                    Rend. (kg/ha)
                  </th>
                  <th className="px-4 py-3 font-medium text-right">
                    Ingreso est.
                  </th>
                  <th className="px-4 py-3 font-medium text-right">Margen</th>
                  <th className="px-4 py-3 font-medium text-right">
                    Margen/kg
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {avgMarginPerKg.rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      No hay datos de costos disponibles.
                    </td>
                  </tr>
                ) : (
                  avgMarginPerKg.rows.map((row) => (
                    <tr
                      key={row.cropId}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-primary-dark">
                        {row.variety}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.parcelName}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-dark">
                          {row.status}
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
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            row.marginPerKg >= 0
                              ? "bg-primary-50 text-primary-dark"
                              : "bg-destructive-light text-destructive-dark"
                          }`}
                        >
                          ${row.marginPerKg.toFixed(2)}/kg
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ================================================================ */}
      {/* TAB: Operativo */}
      {/* ================================================================ */}
      {activeTab === "operativo" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Upcoming Irrigations */}
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="mb-4 flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-500" />
              <h2 className="text-base font-semibold text-primary-dark">
                Próximos riegos
              </h2>
            </div>
            {upcomingIrrigations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay riegos programados.
              </p>
            ) : (
              <ul className="space-y-3">
                {upcomingIrrigations.map((i) => (
                  <li
                    key={i.id}
                    className="flex items-start gap-2 rounded-lg border border-border bg-app-bg p-3"
                  >
                    <CalendarIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-primary-dark">
                        {i.amount}L — {i.method}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(i.irrigation_date)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Upcoming Harvests */}
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="mb-4 flex items-center gap-2">
              <Pizza className="h-5 w-5 text-amber-500" />
              <h2 className="text-base font-semibold text-primary-dark">
                Próximas cosechas
              </h2>
            </div>
            {upcomingHarvests.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay cosechas programadas.
              </p>
            ) : (
              <ul className="space-y-3">
                {upcomingHarvests.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-start gap-2 rounded-lg border border-border bg-app-bg p-3"
                  >
                    <CalendarIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium text-primary-dark">
                        {c.variety}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Est. {formatDate(c.estimated_harvest_date!)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Pending Fertilizations */}
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-500" />
              <h2 className="text-base font-semibold text-primary-dark">
                Fertilizaciones pendientes
              </h2>
            </div>
            {pendingFertilizations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay fertilizaciones pendientes.
              </p>
            ) : (
              <ul className="space-y-3">
                {pendingFertilizations.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-start gap-2 rounded-lg border border-border bg-app-bg p-3"
                  >
                    <CalendarIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium text-primary-dark">
                        {f.producto} ({f.dosis} {f.unidad})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(f.fecha_aplicacion)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
