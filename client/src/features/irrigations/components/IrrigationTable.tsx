import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import type { Irrigation } from "@agri/shared";
import { useCropsStore } from "../../../stores/crops";
import { Badge } from "../../../shared/components/Badge";
import { SearchInput } from "../../../shared/components/SearchInput";
import { IRRIGATION_METHOD_LABELS } from "./IrrigationForm";

interface Props {
  irrigations: Irrigation[];
  onSearch?: (v: string) => void;
  onCropFilter?: (v: string) => void;
  onMethodFilter?: (v: string) => void;
  onDateFrom?: (v: string) => void;
  onDateTo?: (v: string) => void;
}

const METHOD_COLORS: Record<string, string> = {
  aspersion: "bg-blue-100 text-blue-800",
  goteo: "bg-green-100 text-green-800",
  inundacion: "bg-cyan-100 text-cyan-800",
  manual: "bg-amber-100 text-amber-800",
};

const container = {
  animate: { transition: { staggerChildren: 0.05 } },
};

const item = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

export function IrrigationTable({
  irrigations,
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
            id="irrigation-search"
            value={searchValue}
            onChange={handleSearch}
            placeholder="Buscar riego..."
            label="Buscar por cultivo"
          />
        </div>
      </div>

      {/* Table */}
      {irrigations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-gray-500">
          No se encontraron riegos.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2.5 font-medium">Cultivo</th>
                <th className="px-3 py-2.5 font-medium">Fecha</th>
                <th className="px-3 py-2.5 font-medium">Cantidad (L)</th>
                <th className="px-3 py-2.5 font-medium">Método</th>
                <th className="px-3 py-2.5 font-medium">Duración</th>
              </tr>
            </thead>
            <motion.tbody
              variants={container}
              initial="initial"
              animate="animate"
              className="divide-y divide-gray-100"
            >
              {irrigations.map((i) => (
                <motion.tr
                  key={i.id}
                  variants={item}
                  onClick={() => navigate(`/irrigations/${i.id}`)}
                  className="cursor-pointer transition-colors hover:bg-gray-50"
                >
                  <td className="px-3 py-2 font-medium text-gray-900">
                    {cropName(i.crop_id)}
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {new Date(
                      i.irrigation_date + "T00:00:00",
                    ).toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {i.amount.toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    <Badge
                      label={IRRIGATION_METHOD_LABELS[i.method]}
                      color={
                        METHOD_COLORS[i.method] ?? "bg-gray-100 text-gray-800"
                      }
                    />
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {i.duration ? `${i.duration} min` : "\u2014"}
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
