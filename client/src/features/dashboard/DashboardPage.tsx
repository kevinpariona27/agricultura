import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useParcelsStore } from "../../stores/parcels";
import { useCropsStore } from "../../stores/crops";
import { useIrrigationsStore } from "../../stores/irrigations";
import { usePestsStore } from "../../stores/pests";
import { useHarvestsStore } from "../../stores/harvests";
import { useInventoryStore } from "../../stores/inventory";
import { useNotificationStore } from "../../stores/notificationStore";
import { StatCard } from "../../shared/components/StatCard";
import { ImageDisplay } from "../../shared/components/ImageDisplay";
import { DonutChart } from "./components/DonutChart";
import { EvolutionBarChart } from "./components/EvolutionBarChart";

export function DashboardPage() {
  const navigate = useNavigate();
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
  }, [
    fetchParcels,
    fetchCrops,
    fetchIrrigations,
    fetchPests,
    fetchHarvests,
    fetchInventory,
  ]);

  // Compute real-time notifications after data loads
  useEffect(() => {
    if (!loadingParcels && !loadingCrops && !loadingIrrig && !loadingPests && !loadingHarv && !loadingInv) {
      computeNotifications();
    }
  }, [
    crops,
    parcels,
    irrigations,
    pests,
    harvests,
    items,
    loadingParcels,
    loadingCrops,
    loadingIrrig,
    loadingPests,
    loadingHarv,
    loadingInv,
    computeNotifications,
  ]);

  const loading =
    loadingParcels || loadingCrops || loadingIrrig || loadingPests || loadingHarv || loadingInv;

  // Real metrics
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

      {/* Stats grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon="🌾"
          value={parcels.length}
          label="Parcelas"
          color="emerald"
          accent={true}
          onClick={() => navigate("/parcels")}
        />
        <StatCard
          icon="🌱"
          value={cultivosActivos}
          label="Cultivos activos"
          color="indigo"
          onClick={() => navigate("/crops")}
        />
        <StatCard
          icon="💧"
          value={riegosEsteMes}
          label="Riegos este mes"
          color="blue"
          onClick={() => navigate("/irrigations")}
        />
        <StatCard
          icon="🐛"
          value={plagasActivas}
          label="Plagas activas"
          color="red"
          onClick={() => navigate("/pests")}
        />
        <StatCard
          icon="🌽"
          value={harvests.length}
          label="Cosechas totales"
          color="amber"
          onClick={() => navigate("/harvests")}
        />
        <StatCard
          icon="📦"
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
                  <th className="w-10 px-3 py-3 font-medium"></th>
                  <th className="px-4 py-3 font-medium">Insumo</th>
                  <th className="px-4 py-3 font-medium">Categoría</th>
                  <th className="px-4 py-3 font-medium">Cantidad</th>
                  <th className="px-4 py-3 font-medium">Vencimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {expiringItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-3">
                      <ImageDisplay
                        src={item.image_url ?? null}
                        alt={item.nombre}
                        size="sm"
                      />
                    </td>
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
                        {new Date(item.fecha_vencimiento!).toLocaleDateString(
                          "es-ES"
                        )}
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
                  <th className="w-10 px-3 py-3 font-medium"></th>
                  <th className="px-4 py-3 font-medium">Insumo</th>
                  <th className="px-4 py-3 font-medium">Cantidad</th>
                  <th className="px-4 py-3 font-medium">Unidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lowStockItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-3">
                      <ImageDisplay
                        src={item.image_url ?? null}
                        alt={item.nombre}
                        size="sm"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-primary-dark">
                      {item.nombre}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        {item.cantidad}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.unidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
