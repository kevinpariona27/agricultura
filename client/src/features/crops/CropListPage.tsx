import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCropsStore } from "../../stores/crops.js";
import { CropTable } from "./components/CropTable.js";

export function CropListPage() {
  const navigate = useNavigate();
  const { crops, loading, error, fetchAll, clearError } = useCropsStore();

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

  const handleParcelFilter = useCallback(
    (parcel_id: string) => {
      fetchAll({
        parcel_id: parcel_id ? Number(parcel_id) : undefined,
      }).catch(() => {});
    },
    [fetchAll]
  );

  const handleStatusFilter = useCallback(
    (status: string) => {
      fetchAll({ status: (status || undefined) as any }).catch(() => {});
    },
    [fetchAll]
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Cultivos</h1>
        <button
          onClick={() => navigate("/crops/new")}
          className="rounded bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-800"
        >
          + Nuevo cultivo
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && crops.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center text-gray-500">
          Cargando...
        </div>
      ) : (
        <CropTable
          crops={crops}
          onSearch={handleSearch}
          onParcelFilter={handleParcelFilter}
          onStatusFilter={handleStatusFilter}
        />
      )}
    </div>
  );
}
