import { useEffect, useMemo } from "react";
import { useHarvestsStore } from "../../stores/harvests";
import { useInventoryStore } from "../../stores/inventory";
import { usePestsStore } from "../../stores/pests";
import { useCropsStore } from "../../stores/crops";
import { StatCard } from "../../shared/components/StatCard";

const SEVERITY_LABELS: Record<string, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
};

const SEVERITY_COLORS: Record<string, string> = {
  baja: "bg-green-100 text-green-800",
  media: "bg-yellow-100 text-yellow-800",
  alta: "bg-red-100 text-red-800",
};

const TIPO_LABELS: Record<string, string> = {
  plaga: "Plaga",
  enfermedad: "Enfermedad",
};

export function ReportsPage() {
  const {
    harvests,
    fetchAll: fetchHarvests,
    loading: loadingHarv,
  } = useHarvestsStore();
  const {
    items,
    fetchAll: fetchInventory,
    loading: loadingInv,
  } = useInventoryStore();
  const {
    pests,
    fetchAll: fetchPests,
    loading: loadingPests,
  } = usePestsStore();
  const { crops, fetchAll: fetchCrops, loading: loadingCrops } =
    useCropsStore();

  useEffect(() => {
    fetchHarvests();
    fetchInventory();
    fetchPests();
    fetchCrops();
  }, [fetchHarvests, fetchInventory, fetchPests, fetchCrops]);

  const loading =
    loadingHarv || loadingInv || loadingPests || loadingCrops;

  const harvestSummary = useMemo(() => {
    const grouped = new Map<number, { total: number; count: number }>();
    for (const h of harvests) {
      const prev = grouped.get(h.crop_id) ?? { total: 0, count: 0 };
      grouped.set(h.crop_id, {
        total: prev.total + h.cantidad,
        count: prev.count + 1,
      });
    }
    return Array.from(grouped.entries())
      .map(([cropId, data]) => {
        const crop = crops.find((c) => c.id === cropId);
        return {
          cropId,
          cropName: crop?.variety ?? `Cultivo #${cropId}`,
          totalCantidad: data.total,
          harvestCount: data.count,
        };
      })
      .sort((a, b) => b.totalCantidad - a.totalCantidad);
  }, [harvests, crops]);

  const lowStockItems = useMemo(() => {
    return items.filter((item) => item.cantidad <= 5);
  }, [items]);

  const expiringItems = useMemo(() => {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return items
      .filter((item) => {
        if (!item.fecha_vencimiento) return false;
        return new Date(item.fecha_vencimiento) <= thirtyDaysFromNow;
      })
      .sort(
        (a, b) =>
          new Date(a.fecha_vencimiento!).getTime() -
          new Date(b.fecha_vencimiento!).getTime()
      );
  }, [items]);

  const pestDistribution = useMemo(() => {
    const byTipo = new Map<string, number>();
    const bySeveridad = new Map<string, number>();
    for (const p of pests) {
      byTipo.set(p.tipo, (byTipo.get(p.tipo) ?? 0) + 1);
      bySeveridad.set(p.severidad, (bySeveridad.get(p.severidad) ?? 0) + 1);
    }
    return {
      byTipo: Array.from(byTipo.entries()).map(([tipo, count]) => ({
        tipo,
        label: TIPO_LABELS[tipo] ?? tipo,
        count,
      })),
      bySeveridad: Array.from(bySeveridad.entries()).map(
        ([severidad, count]) => ({
          severidad,
          label: SEVERITY_LABELS[severidad] ?? severidad,
          count,
        })
      ),
    };
  }, [pests]);

  if (loading) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-gray-500">
        Cargando...
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-gray-900">Reportes</h1>

      {/* Summary stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon="🌽"
          value={harvests.length}
          label="Cosechas totales"
        />
        <StatCard
          icon="📦"
          value={items.length}
          label="Insumos registrados"
        />
        <StatCard
          icon="🐛"
          value={pests.length}
          label="Plagas registradas"
        />
      </div>

      {/* Harvest summary */}
      <div className="mb-8">
        <h2 className="mb-3 text-lg font-medium tracking-tight text-gray-800">
          Resumen de cosechas por cultivo
        </h2>
        {harvestSummary.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-sm text-gray-500">
            No hay cosechas registradas.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Cultivo</th>
                  <th className="px-4 py-3 font-medium">
                    Cantidad total
                  </th>
                  <th className="px-4 py-3 font-medium">
                    N° de cosechas
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {harvestSummary.map((row) => (
                  <tr key={row.cropId}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {row.cropName}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {row.totalCantidad.toLocaleString("es-ES")}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {row.harvestCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inventory status */}
      <div className="mb-8">
        <h2 className="mb-3 text-lg font-medium tracking-tight text-gray-800">
          Estado del inventario
        </h2>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Low stock */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-gray-600">
              Stock bajo (≤ 5 unidades)
            </h3>
            {lowStockItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 py-6 text-center text-sm text-gray-500">
                No hay insumos con stock bajo.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-100">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-2 font-medium">Insumo</th>
                      <th className="px-4 py-2 font-medium">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {lowStockItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 text-gray-900">
                          {item.nombre}
                        </td>
                        <td className="px-4 py-2">
                          <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                            {item.cantidad} {item.unidad}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Near expiration */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-gray-600">
              Próximos vencimientos (30 días)
            </h3>
            {expiringItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 py-6 text-center text-sm text-gray-500">
                No hay insumos próximos a vencer.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-100">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-2 font-medium">Insumo</th>
                      <th className="px-4 py-2 font-medium">Vence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {expiringItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 text-gray-900">
                          {item.nombre}
                        </td>
                        <td className="px-4 py-2">
                          <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
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
        </div>
      </div>

      {/* Pest history */}
      <div>
        <h2 className="mb-3 text-lg font-medium tracking-tight text-gray-800">
          Historial de plagas
        </h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* By type */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-gray-600">
              Distribución por tipo
            </h3>
            {pestDistribution.byTipo.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 py-6 text-center text-sm text-gray-500">
                No hay plagas registradas.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-100">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-2 font-medium">Tipo</th>
                      <th className="px-4 py-2 font-medium">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pestDistribution.byTipo.map((row) => (
                      <tr key={row.tipo}>
                        <td className="px-4 py-2 text-gray-900">
                          {row.label}
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {row.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* By severity */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-gray-600">
              Distribución por severidad
            </h3>
            {pestDistribution.bySeveridad.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 py-6 text-center text-sm text-gray-500">
                No hay plagas registradas.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-100">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-2 font-medium">Severidad</th>
                      <th className="px-4 py-2 font-medium">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pestDistribution.bySeveridad.map((row) => (
                      <tr key={row.severidad}>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                              SEVERITY_COLORS[row.severidad] ??
                              "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {row.label}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {row.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
