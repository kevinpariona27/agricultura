import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FileText, X } from "lucide-react";
import { useSidebarStore } from "../../stores/sidebar.js";
import { useAuthStore } from "../../stores/auth.js";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/parcels", label: "Parcelas" },
  { to: "/crops", label: "Cultivos" },
  { to: "/irrigations", label: "Riegos" },
  { to: "/harvests", label: "Cosechas" },
  { to: "/inventory", label: "Inventario" },
  { to: "/costs", label: "Costos" },
  { to: "/reports", label: "Reportes" },
  { to: "/profile", label: "Perfil" },
] as const;

export function Sidebar() {
  const isOpen = useSidebarStore((s) => s.isOpen);
  const close = useSidebarStore((s) => s.close);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const [isDesktopExpanded, setIsDesktopExpanded] = useState(false);
  const handleMouseEnter = useCallback(() => setIsDesktopExpanded(true), []);
  const handleMouseLeave = useCallback(() => setIsDesktopExpanded(false), []);

  const sidebarRef = useRef<HTMLElement>(null);

  // Close sidebar on ESC key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && useSidebarStore.getState().isOpen) {
        close();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [close]);

  function handleLogout() {
    logout();
    close();
    navigate("/login");
  }

  return (
    <>
      {/* Mobile backdrop (only visible when sidebar is open) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={close}
          data-testid="sidebar-backdrop"
        />
      )}

      {/* Single sidebar: fixed overlay on mobile, relative persistent on desktop */}
      <aside
        ref={sidebarRef}
        role="complementary"
        aria-label="Sidebar navigation"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`
          flex h-full flex-col bg-primary-dark text-white
          lg:relative lg:w-16 lg:flex-shrink-0
          fixed inset-y-0 left-0 z-50 w-64 transition-all duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${isDesktopExpanded ? "lg:!w-64" : ""}
        `}
      >
        {/* Mobile close button */}
        <button
          onClick={close}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-primary-100/60 transition-colors duration-200 hover:bg-primary-dark/70 hover:text-white lg:hidden"
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Brand */}
        <div className="border-b border-primary-dark/30 px-6 py-5 text-xl font-bold tracking-tight lg:text-center lg:text-sm lg:px-2">
          <span className={isDesktopExpanded ? "" : "lg:hidden"}>Gestión Agrícola</span>
          <span className={isDesktopExpanded ? "hidden" : "hidden lg:inline"}>GA</span>
        </div>

        {/* Nav links */}
        <nav className="flex flex-1 flex-col gap-1 px-3 py-3 lg:px-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={close}
              title={item.label}
              className={({ isActive }) =>
                `rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${isDesktopExpanded ? "" : "lg:px-2 lg:py-3 lg:justify-center"} ${
                  isActive
                    ? `border-l-4 border-primary-light bg-primary text-white ${isDesktopExpanded ? "" : "lg:border-l-0 lg:border-b-2"}`
                    : "text-primary-100/80 transition-colors duration-200 hover:bg-primary-dark/70 hover:text-white"
                }`
              }
            >
              <span className={isDesktopExpanded ? "" : "lg:hidden"}>{item.label}</span>
              <span className={isDesktopExpanded ? "hidden" : "hidden lg:inline text-xs"}>{item.label.slice(0, 3)}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="mt-auto border-t border-primary-dark/30 bg-primary-dark/50 px-6 py-4 lg:px-2">
          <button
            title="Nuevo Reporte"
            className="mb-3 flex w-full cursor-pointer items-center gap-2 rounded-lg bg-primary-light px-4 py-2.5 font-medium text-primary-dark transition-colors duration-200 hover:bg-primary-light/80 lg:justify-center lg:px-2"
          >
            <FileText className="h-5 w-5" />
            <span className={isDesktopExpanded ? "" : "lg:hidden"}>Nuevo Reporte</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full cursor-pointer rounded px-3 py-2 text-left text-sm font-medium text-primary-100/80 transition-colors duration-200 hover:bg-primary-dark/60 hover:text-white lg:text-center lg:text-xs lg:px-1"
            title="Cerrar sesión"
          >
            <span className={isDesktopExpanded ? "" : "lg:hidden"}>Cerrar sesión</span>
            <span className={isDesktopExpanded ? "hidden" : "hidden lg:inline"}>Salir</span>
          </button>
        </div>
      </aside>
    </>
  );
}
