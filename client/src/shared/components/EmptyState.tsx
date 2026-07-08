interface EmptyStateProps {
  icon?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, message, action }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center text-gray-500">
      {icon && <p className="mb-3 text-4xl">{icon}</p>}
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
