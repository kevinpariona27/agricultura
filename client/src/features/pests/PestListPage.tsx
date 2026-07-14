import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Download } from "lucide-react";
import { usePestsStore } from "../../stores/pests";
import { PestTable } from "./components/PestTable";
import { exportToExcel } from "../../shared/utils/exportExcel";

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
        <div className="flex gap-2">
          <button
            onClick={() =>
              exportToExcel(
                pests.map((p) => ({
                  Nombre: p.nombre,
                  Tipo: p.tipo,
                  Severidad: p.severidad,
                  Estado: p.estado,
                  "Fecha detección": p.fecha_deteccion,
                  Tratamiento: p.tratamiento ?? "",
                })),
                "plagas"
              )
            }
            className="flex cursor-pointer items-center gap-2 rounded border border-gray-200 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Exportar Excel
          </button>
          <button
            onClick={() => navigate("/pests/new")}
            className="rounded bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-800"
          >
            + Nueva plaga
          </button>
        </div>
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
