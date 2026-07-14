import { motion } from "framer-motion";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";
type BadgeSize = "sm" | "md";

const VARIANT_COLORS: Record<BadgeVariant, string> = {
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
  neutral: "bg-gray-100 text-gray-700",
};

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
};

interface BadgeProps {
  label: string;
  color?: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
}

export function Badge({
  label,
  color,
  variant = "neutral",
  size = "sm",
}: BadgeProps) {
  const variantClasses = color ?? VARIANT_COLORS[variant];
  const sizeClasses = SIZE_CLASSES[size];

  return (
    <motion.span
      data-testid="badge"
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      className={`inline-block rounded-full font-semibold transition-colors duration-200 ${sizeClasses} ${variantClasses}`}
    >
      {label}
    </motion.span>
  );
}
