import { useEffect, useMemo } from "react";
import { useParcelsStore } from "../../stores/parcels";
import { useCropsStore } from "../../stores/crops";
import { useIrrigationsStore } from "../../stores/irrigations";
import { usePestsStore } from "../../stores/pests";
import { useHarvestsStore } from "../../stores/harvests";
import { useInventoryStore } from "../../stores/inventory";
import { StatCard } from "../../shared/components/StatCard";

export function DashboardPage() {
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

  useEffect(() => {
    fetchParcels();
    fetchCrops();
    fetchIrrigations();
    fetchPests({ estado: "activo" });
    fetchHarvests();
    fetchInventory();
  }, [fetchParcels, fetchCrops, fetchIrrigations, fetchPests, fetchHarvests, fetchInventory]);

  const loading =
    loadingParcels || loadingCrops || loadingIrrig || loadingPests || loadingHarv || loadingInv;

  const expiringItems = useMemo(() => {
    if (!items.length) return [];
    const now = new Date();
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
      <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center text-gray-500">
        Cargando...
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon="🌾"
          value={parcels.length}
          label="Parcelas"
          color="green"
        />
        <StatCard
          icon="🌱"
          value={crops.length}
          label="Cultivos activos"
          color="indigo"
        />
        <StatCard
          icon="💧"
          value={irrigations.length}
          label="Riegos"
          color="blue"
        />
        <StatCard
          icon="🐛"
          value={pests.length}
          label="Plagas activas"
          color="red"
        />
        <StatCard
          icon="🌽"
          value={harvests.length}
          label="Cosechas"
          color="amber"
        />
        <StatCard
          icon="📦"
          value={items.length}
          label="Insumos"
          color="purple"
        />
      </div>

      {/* Próximos vencimientos */}
      <div className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-gray-800">
          Próximos vencimientos
        </h2>
        {expiringItems.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 py-8 text-center text-sm text-gray-500">
            No hay insumos próximos a vencer.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Insumo</th>
                  <th className="px-4 py-3 font-medium">Categoría</th>
                  <th className="px-4 py-3 font-medium">Cantidad</th>
                  <th className="px-4 py-3 font-medium">Vencimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expiringItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {item.nombre}
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-600">
                      {item.categoria}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.cantidad} {item.unidad}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
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
          <h2 className="mb-3 text-lg font-semibold text-gray-800">
            Stock bajo (≤ 5 unidades)
          </h2>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Insumo</th>
                  <th className="px-4 py-3 font-medium">Cantidad</th>
                  <th className="px-4 py-3 font-medium">Unidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lowStockItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {item.nombre}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        {item.cantidad}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.unidad}</td>
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
