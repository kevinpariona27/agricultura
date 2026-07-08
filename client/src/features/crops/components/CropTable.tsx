import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Crop } from "@agri/shared";
import { useParcelsStore } from "../../../stores/parcels.js";
import { CROP_STATUS_LABELS, CROP_STATUS_OPTIONS } from "./CropForm.js";

interface CropTableProps {
  crops: Crop[];
  onSearch: (search: string) => void;
  onParcelFilter: (parcel_id: string) => void;
  onStatusFilter: (status: string) => void;
}

export function CropTable({
  crops,
  onSearch,
  onParcelFilter,
  onStatusFilter,
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
          <label
            htmlFor="search"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Buscar por variedad
          </label>
          <input
            id="search"
            type="text"
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar cultivo..."
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
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
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
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
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
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
        <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center text-gray-500">
          No se encontraron cultivos.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Variedad</th>
                <th className="px-4 py-3 font-medium">Parcela</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Fecha siembra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {crops.map((crop) => (
                <tr
                  key={crop.id}
                  onClick={() => navigate(`/crops/${crop.id}`)}
                  className="cursor-pointer transition-colors hover:bg-green-50"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {crop.variety}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {parcelName(crop.parcel_id)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      {formatStatus(crop.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(crop.planting_date).toLocaleDateString("es-AR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
