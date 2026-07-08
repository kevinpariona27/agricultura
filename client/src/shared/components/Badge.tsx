interface BadgeProps {
  label: string;
  color?: string;
}

export function Badge({ label, color }: BadgeProps) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
        color ?? "bg-gray-100 text-gray-800"
      }`}
    >
      {label}
    </span>
  );
}
