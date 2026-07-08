import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Parcel } from "@agri/shared";
import { SOIL_TYPES } from "./ParcelForm.js";

interface ParcelTableProps {
  parcels: Parcel[];
  onSearch: (search: string) => void;
  onFilter: (soil_type: string) => void;
}

export function ParcelTable({ parcels, onSearch, onFilter }: ParcelTableProps) {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [filterValue, setFilterValue] = useState("");

  function handleSearch(value: string) {
    setSearchValue(value);
    onSearch(value);
  }

  function handleFilter(value: string) {
    setFilterValue(value);
    onFilter(value);
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
            Buscar por nombre
          </label>
          <input
            id="search"
            type="text"
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar lote..."
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        <div className="min-w-[200px]">
          <label
            htmlFor="filter"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Tipo de suelo
          </label>
          <select
            id="filter"
            value={filterValue}
            onChange={(e) => handleFilter(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">Todos</option>
            {SOIL_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {parcels.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center text-gray-500">
          No se encontraron lotes.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Área (ha)</th>
                <th className="px-4 py-3 font-medium">Ubicación</th>
                <th className="px-4 py-3 font-medium">Tipo de suelo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {parcels.map((parcel) => (
                <tr
                  key={parcel.id}
                  onClick={() => navigate(`/parcels/${parcel.id}`)}
                  className="cursor-pointer transition-colors hover:bg-green-50"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {parcel.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{parcel.area}</td>
                  <td className="px-4 py-3 text-gray-600">{parcel.location}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      {parcel.soil_type}
                    </span>
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
