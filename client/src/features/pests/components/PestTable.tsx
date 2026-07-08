import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Pest } from "@agri/shared";
import { useCropsStore } from "../../../stores/crops";
import { Badge } from "../../../shared/components/Badge";

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
            placeholder="Buscar plaga..."
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
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
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
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
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
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
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
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
        <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center text-gray-500">
          No se encontraron plagas.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Cultivo</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Severidad</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pests.map((pest) => (
                <tr
                  key={pest.id}
                  onClick={() => navigate(`/pests/${pest.id}`)}
                  className="cursor-pointer transition-colors hover:bg-green-50"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {cropName(pest.crop_id)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {TIPO_LABELS[pest.tipo] ?? pest.tipo}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {pest.nombre}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      label={SEVERITY_LABELS[pest.severidad] ?? pest.severidad}
                      color={
                        SEVERITY_COLORS[pest.severidad] ??
                        "bg-gray-100 text-gray-800"
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      label={ESTADO_LABELS[pest.estado] ?? pest.estado}
                      color={
                        ESTADO_COLORS[pest.estado] ??
                        "bg-gray-100 text-gray-800"
                      }
                    />
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
