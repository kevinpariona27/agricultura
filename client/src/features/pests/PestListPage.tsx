import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usePestsStore } from "../../stores/pests";
import { PestTable } from "./components/PestTable";

export function PestListPage() {
  const navigate = useNavigate();
  const { pests, loading, error, fetchAll, clearError } =
    usePestsStore();

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

  const handleCropFilter = useCallback(
    (crop_id: string) => {
      fetchAll({
        crop_id: crop_id ? Number(crop_id) : undefined,
      }).catch(() => {});
    },
    [fetchAll]
  );

  const handleTipoFilter = useCallback(
    (tipo: string) => {
      fetchAll({
        tipo: tipo || undefined,
      }).catch(() => {});
    },
    [fetchAll]
  );

  const handleEstadoFilter = useCallback(
    (estado: string) => {
      fetchAll({
        estado: estado || undefined,
      }).catch(() => {});
    },
    [fetchAll]
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Plagas y Enfermedades
        </h1>
        <button
          onClick={() => navigate("/pests/new")}
          className="rounded bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-800"
        >
          + Nueva plaga
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && pests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-gray-500">
          Cargando...
        </div>
      ) : (
        <PestTable
          pests={pests}
          onSearch={handleSearch}
          onCropFilter={handleCropFilter}
          onTipoFilter={handleTipoFilter}
          onEstadoFilter={handleEstadoFilter}
        />
      )}
    </div>
  );
}
