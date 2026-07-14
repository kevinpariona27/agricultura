import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { useCropsStore } from "../../../stores/crops";
import { CROP_STATUS_LABELS } from "../../crops/components/CropForm";
import { EmptyState } from "../../../shared/components/EmptyState";

const STATUS_COLORS: Record<string, string> = {
  planificado: "#D4A017",
  en_crecimiento: "#22C55E",
  floracion: "#B8860B",
  en_cosecha: "#15803D",
  cosechado: "#0F2E1A",
  cancelado: "#8B6914",
};

export function DonutChart() {
  const { crops, loading } = useCropsStore();

  const data = useMemo(() => {
    if (!crops.length) return [];

    const counts: Record<string, number> = {};
    for (const crop of crops) {
      counts[crop.status] = (counts[crop.status] || 0) + 1;
    }

    return Object.entries(counts).map(([status, count]) => ({
      name:
        CROP_STATUS_LABELS[status as keyof typeof CROP_STATUS_LABELS] ?? status,
      value: count,
      fill: STATUS_COLORS[status] ?? "#6b7280",
    }));
  }, [crops]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        Cargando...
      </div>
    );
  }

  if (!data.length) {
    return <EmptyState IconComponent={PieChartIcon} message="Sin datos de cultivos" />;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
