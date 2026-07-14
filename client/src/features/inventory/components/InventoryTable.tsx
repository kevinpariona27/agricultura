import { useState } from "react";
import { motion } from "framer-motion";
import type { Inventory } from "@agri/shared";
import { ImageDisplay } from "../../../shared/components/ImageDisplay";
import { Pagination } from "../../../shared/components/Pagination";
import { SearchInput } from "../../../shared/components/SearchInput";

const CATEGORIA_LABELS: Record<string, string> = {
  fertilizante: "Fertilizante",
  pesticida: "Pesticida",
  semilla: "Semilla",
  herramienta: "Herramienta",
  otro: "Otro",
};

const UNIDAD_LABELS: Record<string, string> = {
  kg: "kg",
  L: "L",
  unidad: "unidad",
  bolsa: "bolsa",
};

interface InventoryTableProps {
  items: Inventory[];
  onSearch: (search: string) => void;
  onCategoriaFilter: (categoria: string) => void;
  onStockFilter?: (stock: string) => void;
  stockFilter?: string;
  page?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
}

const container = {
  animate: { transition: { staggerChildren: 0.05 } },
};

const rowVariant = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

export function InventoryTable({
  items,
  onSearch,
  onCategoriaFilter,
  onStockFilter,
  stockFilter = "",
  page,
  pageSize,
  totalItems,
  onPageChange,
}: InventoryTableProps) {
  const [searchValue, setSearchValue] = useState("");

  function handleSearch(value: string) {
    setSearchValue(value);
    onSearch(value);
  }

  function handleStockFilter(value: string) {
    onStockFilter?.(value);
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <SearchInput
            id="search"
            value={searchValue}
            onChange={handleSearch}
            placeholder="Buscar ítem..."
            label="Buscar por nombre"
          />
        </div>

        <div className="min-w-[200px]">
          <label
            htmlFor="categoria-filter"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Categoría
          </label>
          <select
            id="categoria-filter"
            onChange={(e) => onCategoriaFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">Todas</option>
            <option value="fertilizante">Fertilizante</option>
            <option value="pesticida">Pesticida</option>
            <option value="semilla">Semilla</option>
            <option value="herramienta">Herramienta</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        <div className="min-w-[200px]">
          <label
            htmlFor="stock-filter"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Stock
          </label>
          <select
            id="stock-filter"
            value={stockFilter}
            onChange={(e) => handleStockFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">Todos</option>
            <option value="bajo">Bajo (≤ 5)</option>
            <option value="normal">Normal</option>
          </select>
        </div>
      </div>

      {/* Table — items are already filtered and sliced by the parent */}
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-gray-500">
          No se encontraron ítems de inventario.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="w-10 px-3 py-2.5 font-medium"></th>
                <th className="px-3 py-2.5 font-medium">Nombre</th>
                <th className="px-3 py-2.5 font-medium">Categoría</th>
                <th className="px-3 py-2.5 font-medium">Cantidad</th>
                <th className="px-3 py-2.5 font-medium">Unidad</th>
              </tr>
            </thead>
            <motion.tbody
              variants={container}
              initial="initial"
              animate="animate"
              className="divide-y divide-gray-100"
            >
              {items.map((item) => (
                <motion.tr
                  key={item.id}
                  variants={rowVariant}
                  className="cursor-pointer transition-colors hover:bg-gray-50"
                >
                  <td className="px-3 py-2">
                    <ImageDisplay
                      src={item.image_url ?? null}
                      alt={item.nombre}
                      size="sm"
                    />
                  </td>
                  <td className="px-3 py-2 font-medium text-gray-900">
                    {item.nombre}
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {CATEGORIA_LABELS[item.categoria] ?? item.categoria}
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {item.cantidad}
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {UNIDAD_LABELS[item.unidad] ?? item.unidad}
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>
      )}
      {page !== undefined && pageSize !== undefined && totalItems !== undefined && onPageChange && (
        <Pagination
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
