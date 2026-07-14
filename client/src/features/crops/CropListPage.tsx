import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download } from "lucide-react";
import { useCropsStore } from "../../stores/crops.js";
import { CropTable } from "./components/CropTable.js";
import { CROP_STATUS_LABELS } from "./components/CropForm.js";
import { exportToExcel } from "../../shared/utils/exportExcel.js";

export function CropListPage() {
  const navigate = useNavigate();
  const { crops, loading, error, fetchAll, clearError } = useCropsStore();
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

  const handleParcelFilter = useCallback(
    (parcel_id: string) => {
      setPage(1);
      fetchAll({
        parcel_id: parcel_id ? Number(parcel_id) : undefined,
      }).catch(() => {});
    },
    [fetchAll]
  );

  const handleStatusFilter = useCallback(
    (status: string) => {
      setPage(1);
      fetchAll({ status: (status || undefined) as any }).catch(() => {});
    },
    [fetchAll]
  );

  const paginatedCrops = crops.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Cultivos</h1>
        <div className="flex gap-2">
          <button
            onClick={() =>
              exportToExcel(
                crops.map((c) => ({
                  Variedad: c.variety,
                  Estado:
                    CROP_STATUS_LABELS[c.status as keyof typeof CROP_STATUS_LABELS] ?? c.status,
                  "Fecha siembra": c.planting_date,
                  "Fecha estimada cosecha": c.estimated_harvest_date ?? "",
                  "Densidad siembra": c.planting_density ?? "",
                })),
                "cultivos"
              )
            }
            className="flex cursor-pointer items-center gap-2 rounded border border-gray-200 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Exportar Excel
          </button>
          <button
            onClick={() => navigate("/crops/new")}
            className="rounded bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-800"
          >
            + Nuevo cultivo
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && crops.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-gray-500">
          Cargando...
        </div>
      ) : (
        <CropTable
          crops={paginatedCrops}
          onSearch={handleSearch}
          onParcelFilter={handleParcelFilter}
          onStatusFilter={handleStatusFilter}
          page={page}
          pageSize={pageSize}
          totalItems={crops.length}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
