import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useParcelsStore } from "../../stores/parcels.js";
import { ParcelTable } from "./components/ParcelTable.js";

export function ParcelListPage() {
  const navigate = useNavigate();
  const { parcels, loading, error, fetchAll, clearError } = useParcelsStore();

  useEffect(() => {
    fetchAll();
    return () => clearError();
  }, [fetchAll, clearError]);

  const handleSearch = useCallback(
    (search: string) => {
      fetchAll(search, undefined).catch(() => {});
    },
    [fetchAll]
  );

  const handleFilter = useCallback(
    (soil_type: string) => {
      fetchAll(undefined, soil_type || undefined).catch(() => {});
    },
    [fetchAll]
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Parcelas</h1>
        <button
          onClick={() => navigate("/parcels/new")}
          className="rounded bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-800"
        >
          + Nueva parcela
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && parcels.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center text-gray-500">
          Cargando...
        </div>
      ) : (
        <ParcelTable
          parcels={parcels}
          onSearch={handleSearch}
          onFilter={handleFilter}
        />
      )}
    </div>
  );
}
