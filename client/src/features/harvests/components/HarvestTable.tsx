import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import type { Harvest } from "@agri/shared";
import { useCropsStore } from "../../../stores/crops";
import { Badge } from "../../../shared/components/Badge";
import { SearchInput } from "../../../shared/components/SearchInput";
import { HARVEST_UNIT_LABELS } from "./HarvestForm";

interface Props {
  harvests: Harvest[];
  onSearch?: (v: string) => void;
  onCropFilter?: (v: string) => void;
  onDateFrom?: (v: string) => void;
  onDateTo?: (v: string) => void;
}

const UNIT_COLORS: Record<string, string> = {
  kg: "bg-green-100 text-green-800",
  ton: "bg-purple-100 text-purple-800",
};

const container = {
  animate: { transition: { staggerChildren: 0.05 } },
};

const item = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

export function HarvestTable({
  harvests,
  onSearch,
}: Props) {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");

  const crops = useCropsStore((s) => s.crops);
  const fetchCrops = useCropsStore((s) => s.fetchAll);

  useEffect(() => {
    if (crops.length === 0) {
      fetchCrops();
    }
  }, [crops.length, fetchCrops]);

  function handleSearch(value: string) {
    setSearchValue(value);
    onSearch?.(value);
  }

  function cropName(crop_id: number): string {
    const crop = crops.find((c) => c.id === crop_id);
    return crop?.variety ?? `#${crop_id}`;
  }

  return (
    <div>
      {/* Search */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <SearchInput
            id="harvest-search"
            value={searchValue}
            onChange={handleSearch}
            placeholder="Buscar cosecha..."
            label="Buscar por cultivo"
          />
        </div>
      </div>

      {/* Table */}
      {harvests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-gray-500">
          No se encontraron cosechas.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2.5 font-medium">Cultivo</th>
                <th className="px-3 py-2.5 font-medium">Fecha cosecha</th>
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
              {harvests.map((h) => (
                <motion.tr
                  key={h.id}
                  variants={item}
                  onClick={() => navigate(`/harvests/${h.id}`)}
                  className="cursor-pointer transition-colors hover:bg-gray-50"
                >
                  <td className="px-3 py-2 font-medium text-gray-900">
                    {cropName(h.crop_id)}
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {new Date(
                      h.fecha_cosecha + "T00:00:00",
                    ).toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {h.cantidad.toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    <Badge
                      label={HARVEST_UNIT_LABELS[h.unidad]}
                      color={
                        UNIT_COLORS[h.unidad] ?? "bg-gray-100 text-gray-800"
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
