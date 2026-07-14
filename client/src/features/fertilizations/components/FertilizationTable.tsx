import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import type { Fertilization } from "@agri/shared";
import { useCropsStore } from "../../../stores/crops";
import { Pagination } from "../../../shared/components/Pagination";
import { SearchInput } from "../../../shared/components/SearchInput";

const UNIT_LABELS: Record<string, string> = {
  "kg/ha": "kg/ha",
  "L/ha": "L/ha",
};

interface FertilizationTableProps {
  fertilizations: Fertilization[];
  onSearch: (search: string) => void;
  onCropFilter: (crop_id: string) => void;
  page?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
}

const container = {
  animate: { transition: { staggerChildren: 0.05 } },
};

const item = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

export function FertilizationTable({
  fertilizations,
  onSearch,
  onCropFilter,
  page,
  pageSize,
  totalItems,
  onPageChange,
}: FertilizationTableProps) {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [cropFilter, setCropFilter] = useState("");

  const crops = useCropsStore((s) => s.crops);
  const fetchCrops = useCropsStore((s) => s.fetchAll);

  useEffect(() => {
    if (crops.length === 0) {
      fetchCrops();
    }
  }, [crops.length, fetchCrops]);

  function handleSearch(value: string) {
    setSearchValue(value);
    onSearch(value);
  }

  function handleCropFilter(value: string) {
    setCropFilter(value);
    onCropFilter(value);
  }

  function cropName(crop_id: number): string {
    const crop = crops.find((c) => c.id === crop_id);
    return crop?.variety ?? `Cultivo #${crop_id}`;
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("es-AR");
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
            placeholder="Buscar fertilización..."
            label="Buscar por producto"
          />
        </div>

        <div className="min-w-[200px]">
          <label
            htmlFor="crop-filter"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Cultivo
          </label>
          <select
            id="crop-filter"
            value={cropFilter}
            onChange={(e) => handleCropFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">Todos</option>
            {crops.map((c) => (
              <option key={c.id} value={c.id}>
                {c.variety}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {fertilizations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-gray-500">
          No se encontraron fertilizaciones.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2.5 font-medium">Cultivo</th>
                <th className="px-3 py-2.5 font-medium">Producto</th>
                <th className="px-3 py-2.5 font-medium">Dosis</th>
                <th className="px-3 py-2.5 font-medium">Fecha</th>
              </tr>
            </thead>
            <motion.tbody
              variants={container}
              initial="initial"
              animate="animate"
              className="divide-y divide-gray-100"
            >
              {fertilizations.map((fert) => (
                <motion.tr
                  key={fert.id}
                  variants={item}
                  onClick={() => navigate(`/fertilizations/${fert.id}`)}
                  className="cursor-pointer transition-colors hover:bg-gray-50"
                >
                  <td className="px-3 py-2 font-medium text-gray-900">
                    {cropName(fert.crop_id)}
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {fert.producto}
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {fert.dosis}{" "}
                    <span className="text-gray-400">
                      {UNIT_LABELS[fert.unidad] ?? fert.unidad}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {formatDate(fert.fecha_aplicacion)}
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
