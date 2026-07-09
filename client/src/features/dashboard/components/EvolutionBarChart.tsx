import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useIrrigationsStore } from "../../../stores/irrigations";
import { useHarvestsStore } from "../../../stores/harvests";

const MESES = [
  "",
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

function formatMonthLabel(ym: string): string {
  const [year, month] = ym.split("-");
  return `${MESES[parseInt(month, 10)]} ${year.slice(2)}`;
}

export function EvolutionBarChart() {
  const { irrigations, loading: loadingIrrig } = useIrrigationsStore();
  const { harvests, loading: loadingHarv } = useHarvestsStore();

  const loading = loadingIrrig || loadingHarv;

  const data = useMemo(() => {
    const byMonth: Record<string, { riego: number; cosecha: number }> = {};

    for (const irr of irrigations) {
      const d = new Date(irr.irrigation_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!byMonth[key]) byMonth[key] = { riego: 0, cosecha: 0 };
      byMonth[key].riego += irr.amount;
    }

    for (const har of harvests) {
      const d = new Date(har.fecha_cosecha);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!byMonth[key]) byMonth[key] = { riego: 0, cosecha: 0 };
      byMonth[key].cosecha += har.cantidad;
    }

    const sorted = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12);

    return sorted.map(([month, values]) => ({
      month: formatMonthLabel(month),
      riego: values.riego,
      cosecha: values.cosecha,
    }));
  }, [irrigations, harvests]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        Cargando...
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        No hay datos de evolución
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip />
        <Legend />
        <Bar
          yAxisId="left"
          dataKey="riego"
          name="Riego (L)"
          fill="#60a5fa"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          yAxisId="right"
          dataKey="cosecha"
          name="Cosecha (kg)"
          fill="#059669"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
