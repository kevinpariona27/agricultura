import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download } from "lucide-react";
import { useParcelsStore } from "../../stores/parcels.js";
import { ParcelTable } from "./components/ParcelTable.js";
import { exportToExcel } from "../../shared/utils/exportExcel.js";

export function ParcelListPage() {
  const navigate = useNavigate();
  const { parcels, loading, error, fetchAll, clearError } = useParcelsStore();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchAll();
    return () => clearError();
  }, [fetchAll, clearError]);

  const handleSearch = useCallback(
    (search: string) => {
      setPage(1);
      fetchAll(search, undefined).catch(() => {});
    },
    [fetchAll]
  );

  const handleFilter = useCallback(
    (soil_type: string) => {
      setPage(1);
      fetchAll(undefined, soil_type || undefined).catch(() => {});
    },
    [fetchAll]
  );

  const paginatedParcels = parcels.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Parcelas</h1>
        <div className="flex gap-2">
          <button
            onClick={() =>
              exportToExcel(
                parcels.map((p) => ({
                  Nombre: p.name,
                  "Área (ha)": p.area,
                  Ubicación: p.location,
                  "Tipo de suelo": p.soil_type,
                })),
                "parcelas"
              )
            }
            className="flex cursor-pointer items-center gap-2 rounded border border-gray-200 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Exportar Excel
          </button>
          <button
            onClick={() => navigate("/parcels/new")}
            className="rounded bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-800"
          >
            + Nueva parcela
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && parcels.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-gray-500">
          Cargando...
        </div>
      ) : (
        <ParcelTable
          parcels={paginatedParcels}
          onSearch={handleSearch}
          onFilter={handleFilter}
          page={page}
          pageSize={pageSize}
          totalItems={parcels.length}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
