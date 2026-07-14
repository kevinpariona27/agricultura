import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSidebarStore } from "../../stores/sidebar";

/**
 * Global keyboard shortcuts:
 * - Ctrl+N → /parcels/new
 * - Ctrl+D → /dashboard
 * - Ctrl+R → /reports
 * - Escape → close sidebar / modals
 */
export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const closeSidebar = useSidebarStore((s) => s.close);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Only trigger when not typing in an input/textarea/select
      const tag = (e.target as HTMLElement).tagName;
      const isEditing =
        tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      const isContentEditable = (e.target as HTMLElement).contentEditable === "true";

      // Escape always works (close sidebar/modals)
      if (e.key === "Escape") {
        closeSidebar();
        return;
      }

      // Skip Ctrl+key combos when editing text
      if (isEditing || isContentEditable) return;

      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key === "n") {
        e.preventDefault();
        navigate("/parcels/new");
      } else if (ctrl && e.key === "d") {
        e.preventDefault();
        navigate("/dashboard");
      } else if (ctrl && e.key === "r") {
        e.preventDefault();
        navigate("/reports");
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [navigate, closeSidebar]);
}
