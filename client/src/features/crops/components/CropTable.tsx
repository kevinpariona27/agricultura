import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import type { Crop } from "@agri/shared";
import { useParcelsStore } from "../../../stores/parcels.js";
import { Badge } from "../../../shared/components/Badge";
import { Pagination } from "../../../shared/components/Pagination";
import { SearchInput } from "../../../shared/components/SearchInput";
import { CROP_STATUS_LABELS, CROP_STATUS_OPTIONS } from "./CropForm.js";

interface CropTableProps {
  crops: Crop[];
  onSearch: (search: string) => void;
  onParcelFilter: (parcel_id: string) => void;
  onStatusFilter: (status: string) => void;
  page?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
}

const CROP_STATUS_COLORS: Record<string, string> = {
  planificado: "bg-blue-100 text-blue-800",
  en_crecimiento: "bg-emerald-100 text-emerald-800",
  floracion: "bg-amber-100 text-amber-800",
  cosechado: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-800",
};

const container = {
  animate: { transition: { staggerChildren: 0.05 } },
};

const item = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

export function CropTable({
  crops,
  onSearch,
  onParcelFilter,
  onStatusFilter,
  page,
  pageSize,
  totalItems,
  onPageChange,
}: CropTableProps) {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [parcelFilter, setParcelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const parcels = useParcelsStore((s) => s.parcels);
  const fetchParcels = useParcelsStore((s) => s.fetchAll);

  useEffect(() => {
    if (parcels.length === 0) {
      fetchParcels();
    }
  }, [parcels.length, fetchParcels]);

  function handleSearch(value: string) {
    setSearchValue(value);
    onSearch(value);
  }

  function handleParcelFilter(value: string) {
    setParcelFilter(value);
    onParcelFilter(value);
  }

  function handleStatusFilter(value: string) {
    setStatusFilter(value);
    onStatusFilter(value);
  }

  function parcelName(parcel_id: number): string {
    const parcel = parcels.find((p) => p.id === parcel_id);
    return parcel?.name ?? `Lote #${parcel_id}`;
  }

  function formatStatus(status: string): string {
    return (
      CROP_STATUS_LABELS[status as keyof typeof CROP_STATUS_LABELS] ?? status
    );
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
            placeholder="Buscar cultivo..."
            label="Buscar por variedad"
          />
        </div>

        <div className="min-w-[200px]">
          <label
            htmlFor="parcel-filter"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Parcela
          </label>
          <select
            id="parcel-filter"
            value={parcelFilter}
            onChange={(e) => handleParcelFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">Todas</option>
            {parcels.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[200px]">
          <label
            htmlFor="status-filter"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Estado
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">Todos</option>
            {CROP_STATUS_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {crops.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-gray-500">
          No se encontraron cultivos.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2.5 font-medium">Variedad</th>
                <th className="px-3 py-2.5 font-medium">Parcela</th>
                <th className="px-3 py-2.5 font-medium">Estado</th>
                <th className="px-3 py-2.5 font-medium">Fecha siembra</th>
              </tr>
            </thead>
            <motion.tbody
              variants={container}
              initial="initial"
              animate="animate"
              className="divide-y divide-gray-100"
            >
              {crops.map((crop) => (
                <motion.tr
                  key={crop.id}
                  variants={item}
                  onClick={() => navigate(`/crops/${crop.id}`)}
                  className="cursor-pointer transition-colors hover:bg-gray-50"
                >
                  <td className="px-3 py-2 font-medium text-gray-900">
                    {crop.variety}
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {parcelName(crop.parcel_id)}
                  </td>
                  <td className="px-3 py-2">
                    <Badge
                      label={formatStatus(crop.status)}
                      color={
                        CROP_STATUS_COLORS[crop.status] ??
                        "bg-gray-100 text-gray-800"
                      }
                    />
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {new Date(crop.planting_date).toLocaleDateString("es-AR")}
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
