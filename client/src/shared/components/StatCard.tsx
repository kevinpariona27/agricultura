interface StatCardProps {
  icon: string;
  value: number;
  label: string;
  color: string;
}

const COLOR_MAP: Record<string, { border: string; bg: string; text: string }> = {
  green: {
    border: "border-l-green-500",
    bg: "bg-green-50",
    text: "text-green-700",
  },
  blue: {
    border: "border-l-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-700",
  },
  amber: {
    border: "border-l-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-700",
  },
  purple: {
    border: "border-l-purple-500",
    bg: "bg-purple-50",
    text: "text-purple-700",
  },
  red: {
    border: "border-l-red-500",
    bg: "bg-red-50",
    text: "text-red-700",
  },
  indigo: {
    border: "border-l-indigo-500",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
  },
};

export function StatCard({ icon, value, label, color }: StatCardProps) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.blue;

  return (
    <div
      className={`rounded-lg border border-gray-200 ${c.bg} border-l-4 ${c.border} p-5 shadow-sm transition-shadow hover:shadow-md`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className={`mt-1 text-3xl font-bold ${c.text}`}>{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}
