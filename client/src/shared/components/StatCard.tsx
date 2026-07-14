import { motion } from "framer-motion";

/**
 * Accent is the primary business KPI indicator, NOT a 'has data' indicator.
 * Only StatCards with accent={true} render a colored left-border accent.
 * All other StatCards render with neutral border styling regardless of their metric value.
 */
interface StatCardProps {
  icon: string;
  value: number;
  label: string;
  color?: string;
  accent?: boolean;
}

const COLOR_MAP: Record<string, { border: string; bg: string; text: string }> = {
  green: {
    border: "border-l-primary-light",
    bg: "bg-primary-50",
    text: "text-primary-dark",
  },
  emerald: {
    border: "border-l-primary",
    bg: "bg-primary-50/30",
    text: "text-primary-dark",
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
    border: "border-l-destructive",
    bg: "bg-destructive-light",
    text: "text-destructive-dark",
  },
  indigo: {
    border: "border-l-indigo-500",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
  },
};

export function StatCard({ icon, value, label, color, accent = false }: StatCardProps) {
  const c = color ? COLOR_MAP[color] ?? COLOR_MAP.blue : null;

  const containerClass =
    accent && c
      ? `rounded-2xl border border-border ${c.bg} border-l-4 ${c.border} p-6 shadow-sm transition-shadow duration-200 hover:shadow-md cursor-pointer`
      : "rounded-2xl border border-border bg-surface p-6 shadow-sm transition-shadow duration-200 hover:shadow-md cursor-pointer";

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.15 }}
      className={containerClass}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className={`mt-1 text-3xl font-bold ${c?.text ?? "text-primary-dark"}`}>
            {value}
          </p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </motion.div>
  );
}
