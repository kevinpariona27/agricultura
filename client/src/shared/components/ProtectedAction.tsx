import type { ReactNode } from "react";
import { useUserRole } from "../../stores/auth.js";

interface ProtectedActionProps {
  /** The roles allowed to see this action */
  roles: string[];
  /** Content to render if the user has the required role */
  children: ReactNode;
  /** Optional fallback to show instead of nothing (default: null = hidden) */
  fallback?: ReactNode;
}

/**
 * Wraps buttons, links, or any UI elements and hides them
 * if the current user doesn't have one of the required roles.
 *
 * Use this to protect "Nuevo", "Editar", "Eliminar" action buttons.
 */
export function ProtectedAction({ roles, children, fallback = null }: ProtectedActionProps) {
  const role = useUserRole();

  if (!role) return null;
  if (!roles.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
