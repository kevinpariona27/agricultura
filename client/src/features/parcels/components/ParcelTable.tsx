import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import type { Parcel } from "@agri/shared";
import { Badge } from "../../../shared/components/Badge";
import { ImageDisplay } from "../../../shared/components/ImageDisplay";
import { SearchInput } from "../../../shared/components/SearchInput";
import { SOIL_TYPES } from "./ParcelForm.js";

interface ParcelTableProps {
  parcels: Parcel[];
  onSearch: (search: string) => void;
  onFilter: (soil_type: string) => void;
}

const container = {
  animate: { transition: { staggerChildren: 0.05 } },
};

const item = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

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
          <SearchInput
            id="search"
            value={searchValue}
            onChange={handleSearch}
            placeholder="Buscar lote..."
            label="Buscar por nombre"
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
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
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
        <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-gray-500">
          No se encontraron lotes.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="w-10 px-3 py-2.5 font-medium"></th>
                <th className="px-3 py-2.5 font-medium">Nombre</th>
                <th className="px-3 py-2.5 font-medium">Área (ha)</th>
                <th className="px-3 py-2.5 font-medium">Ubicación</th>
                <th className="px-3 py-2.5 font-medium">Tipo de suelo</th>
              </tr>
            </thead>
            <motion.tbody
              variants={container}
              initial="initial"
              animate="animate"
              className="divide-y divide-gray-100"
            >
              {parcels.map((parcel) => (
                <motion.tr
                  key={parcel.id}
                  variants={item}
                  onClick={() => navigate(`/parcels/${parcel.id}`)}
                  className="cursor-pointer transition-colors hover:bg-gray-50"
                >
                  <td className="px-3 py-2">
                    <ImageDisplay
                      src={parcel.image_url ?? null}
                      alt={parcel.name}
                      size="sm"
                    />
                  </td>
                  <td className="px-3 py-2 font-medium text-gray-900">
                    {parcel.name}
                  </td>
                  <td className="px-3 py-2 text-gray-600">{parcel.area}</td>
                  <td className="px-3 py-2 text-gray-600">{parcel.location}</td>
                  <td className="px-3 py-2">
                    <Badge
                      label={parcel.soil_type}
                      variant="success"
                    />
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>
      )}
    </div>
  );
}
