import { useEffect } from "react";
import { useBlocker } from "react-router-dom";

interface UseUnsavedChangesOptions {
  hasUnsavedChanges: boolean;
  message?: string;
}

/**
 * Warns the user before navigating away when there are unsaved changes.
 * Uses React Router's useBlocker for in-app navigation and
 * window.beforeunload for browser tab/window close.
 */
export function useUnsavedChanges({
  hasUnsavedChanges,
  message = "Tienes cambios sin guardar. ¿Estás seguro de que deseas salir?",
}: UseUnsavedChangesOptions) {
  // Browser tab/window close warning
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = message;
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, message]);

  // In-app navigation blocker
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      const confirmed = window.confirm(message);
      if (confirmed) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker, message]);

  return blocker;
}
