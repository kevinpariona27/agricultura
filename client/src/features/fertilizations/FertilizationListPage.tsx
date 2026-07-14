import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download } from "lucide-react";
import { useFertilizationsStore } from "../../stores/fertilizations";
import { FertilizationTable } from "./components/FertilizationTable";
import { exportToExcel } from "../../shared/utils/exportExcel";

export function FertilizationListPage() {
  const navigate = useNavigate();
  const { fertilizations, loading, error, fetchAll, clearError } =
    useFertilizationsStore();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchAll();
    return () => clearError();
  }, [fetchAll, clearError]);

  const handleSearch = useCallback(
    (search: string) => {
      setPage(1);
      fetchAll({ search: search || undefined }).catch(() => {});
    },
    [fetchAll]
  );

  const handleCropFilter = useCallback(
    (crop_id: string) => {
      setPage(1);
      fetchAll({
        crop_id: crop_id ? Number(crop_id) : undefined,
      }).catch(() => {});
    },
    [fetchAll]
  );

  const paginatedFertilizations = fertilizations.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Fertilizaciones</h1>
        <div className="flex gap-2">
          <button
            onClick={() =>
              exportToExcel(
                fertilizations.map((f) => ({
                  Producto: f.producto,
                  Dosis: f.dosis,
                  Unidad: f.unidad,
                  "Fecha aplicación": f.fecha_aplicacion,
                  Costo: f.costo ?? "",
                })),
                "fertilizaciones"
              )
            }
            className="flex cursor-pointer items-center gap-2 rounded border border-gray-200 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Exportar Excel
          </button>
          <button
            onClick={() => navigate("/fertilizations/new")}
            className="rounded bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-800"
          >
            + Nueva fertilización
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && fertilizations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-gray-500">
          Cargando...
        </div>
      ) : (
        <FertilizationTable
          fertilizations={paginatedFertilizations}
          onSearch={handleSearch}
          onCropFilter={handleCropFilter}
          page={page}
          pageSize={pageSize}
          totalItems={fertilizations.length}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
