import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useInventoryStore } from "../../stores/inventory";
import { InventoryTable } from "./components/InventoryTable";

export function InventoryListPage() {
  const navigate = useNavigate();
  const { items, loading, error, fetchAll, clearError } =
    useInventoryStore();

  useEffect(() => {
    fetchAll();
    return () => clearError();
  }, [fetchAll, clearError]);

  const handleSearch = useCallback(
    (search: string) => {
      fetchAll({ search: search || undefined }).catch(() => {});
    },
    [fetchAll]
  );

  const handleCategoriaFilter = useCallback(
    (categoria: string) => {
      fetchAll({
        categoria: categoria || undefined,
      }).catch(() => {});
    },
    [fetchAll]
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Inventario
        </h1>
        <button
          onClick={() => navigate("/inventory/new")}
          className="rounded bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-800"
        >
          + Nuevo ítem
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-gray-500">
          Cargando...
        </div>
      ) : (
        <InventoryTable
          items={items}
          onSearch={handleSearch}
          onCategoriaFilter={handleCategoriaFilter}
        />
      )}
    </div>
  );
}
