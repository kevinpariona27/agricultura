import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, FileText } from "lucide-react";
import { useInventoryStore } from "../../stores/inventory";
import { InventoryTable } from "./components/InventoryTable";
import { exportToExcel } from "../../shared/utils/exportExcel";
import { exportTableToPDF } from "../../shared/utils/exportPDF";
import { ProtectedAction } from "../../shared/components/ProtectedAction";
import { SkeletonTable } from "../../shared/components/Skeleton";

export function InventoryListPage() {
  const navigate = useNavigate();
  const { items, loading, error, fetchAll, clearError } =
    useInventoryStore();
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [stockFilter, setStockFilter] = useState("");

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
      setPage(1);
      fetchAll({
        categoria: categoria || undefined,
      }).catch(() => {});
    },
    [fetchAll]
  );

  const handleStockFilter = useCallback(
    (stock: string) => {
      setStockFilter(stock);
      setPage(1);
    },
    []
  );

  // Apply client-side stock filter, then paginate
  const filteredItems =
    stockFilter === "bajo"
      ? items.filter((i) => i.cantidad <= 5)
      : stockFilter === "normal"
        ? items.filter((i) => i.cantidad > 5)
        : items;

  const paginatedItems = filteredItems.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Inventario
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() =>
              exportToExcel(
                items.map((i) => ({
                  Nombre: i.nombre,
                  Categoría: i.categoria,
                  Cantidad: i.cantidad,
                  Unidad: i.unidad,
                  "Costo unitario": i.costo_unitario ?? "",
                  Vencimiento: i.fecha_vencimiento ?? "",
                })),
                "inventario"
              )
            }
            className="flex cursor-pointer items-center gap-2 rounded border border-gray-200 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Exportar Excel
          </button>
          <button
            onClick={() =>
              exportTableToPDF(
                "Inventario",
                [
                  { header: "Nombre", dataKey: "nombre" },
                  { header: "Categoría", dataKey: "categoria" },
                  { header: "Cantidad", dataKey: "cantidad" },
                  { header: "Unidad", dataKey: "unidad" },
                  { header: "Costo unitario", dataKey: "costo_unitario" },
                  { header: "Vencimiento", dataKey: "fecha_vencimiento" },
                ],
                items as any,
                "inventario"
              )
            }
            className="flex cursor-pointer items-center gap-2 rounded border border-gray-200 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
          >
            <FileText className="h-4 w-4" />
            Exportar PDF
          </button>
          <ProtectedAction roles={["admin", "manager"]}>
            <button
              onClick={() => navigate("/inventory/new")}
              className="rounded bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-800"
            >
              + Nuevo ítem
            </button>
          </ProtectedAction>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && items.length === 0 ? (
        <SkeletonTable rows={5} cols={7} />
      ) : (
        <InventoryTable
          items={paginatedItems}
          onSearch={handleSearch}
          onCategoriaFilter={handleCategoriaFilter}
          onStockFilter={handleStockFilter}
          stockFilter={stockFilter}
          page={page}
          pageSize={pageSize}
          totalItems={filteredItems.length}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
