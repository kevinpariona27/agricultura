import type { ReactNode } from "react";

interface TooltipProps {
  text: string;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

const positionClasses: Record<string, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

export function Tooltip({ text, children, position = "top" }: TooltipProps) {
  if (!text) return <>{children}</>;

  return (
    <div className="group relative inline-flex">
      {children}
      <span
        className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 dark:bg-gray-100 dark:text-gray-900 ${positionClasses[position]}`}
      >
        {text}
      </span>
    </div>
  );
}
