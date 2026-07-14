import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import type { Pest } from "@agri/shared";
import { useCropsStore } from "../../../stores/crops";
import { Badge } from "../../../shared/components/Badge";
import { ImageDisplay } from "../../../shared/components/ImageDisplay";
import { SearchInput } from "../../../shared/components/SearchInput";

const TIPO_LABELS: Record<string, string> = {
  plaga: "Plaga",
  enfermedad: "Enfermedad",
};

const SEVERITY_LABELS: Record<string, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
};

const SEVERITY_COLORS: Record<string, string> = {
  baja: "bg-green-100 text-green-800",
  media: "bg-yellow-100 text-yellow-800",
  alta: "bg-red-100 text-red-800",
};

const ESTADO_LABELS: Record<string, string> = {
  activo: "Activo",
  controlado: "Controlado",
  erradicado: "Erradicado",
};

const ESTADO_COLORS: Record<string, string> = {
  activo: "bg-blue-100 text-blue-800",
  controlado: "bg-green-100 text-green-800",
  erradicado: "bg-gray-100 text-gray-800",
};

interface PestTableProps {
  pests: Pest[];
  onSearch: (search: string) => void;
  onCropFilter: (crop_id: string) => void;
  onTipoFilter: (tipo: string) => void;
  onEstadoFilter: (estado: string) => void;
}

const container = {
  animate: { transition: { staggerChildren: 0.05 } },
};

const item = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

export function PestTable({
  pests,
  onSearch,
  onCropFilter,
  onTipoFilter,
  onEstadoFilter,
}: PestTableProps) {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [cropFilter, setCropFilter] = useState("");
  const [tipoFilter, setTipoFilter] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");

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

  function handleTipoFilter(value: string) {
    setTipoFilter(value);
    onTipoFilter(value);
  }

  function handleEstadoFilter(value: string) {
    setEstadoFilter(value);
    onEstadoFilter(value);
  }

  function cropName(crop_id: number): string {
    const crop = crops.find((c) => c.id === crop_id);
    return crop?.variety ?? `Cultivo #${crop_id}`;
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
            placeholder="Buscar plaga..."
            label="Buscar por nombre"
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

        <div className="min-w-[160px]">
          <label
            htmlFor="tipo-filter"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Tipo
          </label>
          <select
            id="tipo-filter"
            value={tipoFilter}
            onChange={(e) => handleTipoFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">Todos</option>
            <option value="plaga">Plaga</option>
            <option value="enfermedad">Enfermedad</option>
          </select>
        </div>

        <div className="min-w-[180px]">
          <label
            htmlFor="estado-filter"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Estado
          </label>
          <select
            id="estado-filter"
            value={estadoFilter}
            onChange={(e) => handleEstadoFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">Todos</option>
            <option value="activo">Activo</option>
            <option value="controlado">Controlado</option>
            <option value="erradicado">Erradicado</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {pests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-gray-500">
          No se encontraron plagas.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="w-10 px-3 py-2.5 font-medium"></th>
                <th className="px-3 py-2.5 font-medium">Cultivo</th>
                <th className="px-3 py-2.5 font-medium">Tipo</th>
                <th className="px-3 py-2.5 font-medium">Nombre</th>
                <th className="px-3 py-2.5 font-medium">Severidad</th>
                <th className="px-3 py-2.5 font-medium">Estado</th>
              </tr>
            </thead>
            <motion.tbody
              variants={container}
              initial="initial"
              animate="animate"
              className="divide-y divide-gray-100"
            >
              {pests.map((pest) => (
                <motion.tr
                  key={pest.id}
                  variants={item}
                  onClick={() => navigate(`/pests/${pest.id}`)}
                  className="cursor-pointer transition-colors hover:bg-gray-50"
                >
                  <td className="px-3 py-2">
                    <ImageDisplay
                      src={pest.image_url ?? null}
                      alt={pest.nombre}
                      size="sm"
                    />
                  </td>
                  <td className="px-3 py-2 font-medium text-gray-900">
                    {cropName(pest.crop_id)}
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {TIPO_LABELS[pest.tipo] ?? pest.tipo}
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {pest.nombre}
                  </td>
                  <td className="px-3 py-2">
                    <Badge
                      label={SEVERITY_LABELS[pest.severidad] ?? pest.severidad}
                      color={
                        SEVERITY_COLORS[pest.severidad] ??
                        "bg-gray-100 text-gray-800"
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Badge
                      label={ESTADO_LABELS[pest.estado] ?? pest.estado}
                      color={
                        ESTADO_COLORS[pest.estado] ??
                        "bg-gray-100 text-gray-800"
                      }
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
