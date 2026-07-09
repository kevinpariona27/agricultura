interface EmptyStateProps {
  icon?: string;
  IconComponent?: React.ComponentType<{ className?: string }>;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, IconComponent, message, action }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-gray-500">
      {IconComponent ? (
        <div className="mb-3 flex justify-center">
          <IconComponent className="h-12 w-12 text-zinc-700" />
        </div>
      ) : icon ? (
        <p className="mb-3 text-4xl">{icon}</p>
      ) : null}
      <p className="text-sm">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 rounded bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-800"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
