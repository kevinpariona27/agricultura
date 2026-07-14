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
  { to: "/pests", label: "Plagas" },
  { to: "/inventory", label: "Inventario" },
  { to: "/costs", label: "Costos", short: "Cst" },
  { to: "/calendar", label: "Calendario", short: "Cal" },
  { to: "/map", label: "Mapa" },
  { to: "/reports", label: "Reportes" },
  { to: "/alerts", label: "Alertas", short: "Alt" },
  { to: "/legal", label: "Cuaderno" },
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
          flex h-full flex-col bg-white border-r border-border
          lg:relative lg:w-16 lg:flex-shrink-0
          fixed inset-y-0 left-0 z-50 w-64 transition-all duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${isDesktopExpanded ? "lg:!w-72" : ""}
        `}
      >
        {/* Mobile close button */}
        <button
          onClick={close}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-gray-400 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-600 lg:hidden"
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Brand */}
        <div className="border-b border-border px-6 py-5 text-xl font-bold tracking-tight text-gray-800 lg:text-center lg:text-sm lg:px-2">
          <span className={isDesktopExpanded ? "" : "lg:hidden"}>Gestión Agrícola</span>
          <span className={isDesktopExpanded ? "hidden" : "hidden lg:inline text-primary font-bold"}>GA</span>
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
                    ? `border-l-4 border-primary bg-primary-50 text-primary ${isDesktopExpanded ? "" : "lg:border-l-0 lg:border-b-2"}`
                    : "text-gray-500 transition-colors duration-200 hover:bg-gray-50 hover:text-gray-700"
                }`
              }
            >
              <span className={isDesktopExpanded ? "" : "lg:hidden"}>{item.label}</span>
              <span className={isDesktopExpanded ? "hidden" : "hidden lg:inline text-xs"}>{(item as any).short ?? item.label.slice(0, 3)}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="mt-auto border-t border-border bg-gray-50 px-6 py-4 lg:px-2">
          <button
            title="Nuevo Reporte"
            className="mb-3 flex w-full cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-white transition-colors duration-200 hover:bg-primary-dark lg:justify-center lg:px-2"
          >
            <FileText className="h-5 w-5" />
            <span className={isDesktopExpanded ? "" : "lg:hidden"}>Nuevo Reporte</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full cursor-pointer rounded px-3 py-2 text-left text-sm font-medium text-gray-400 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-600 lg:text-center lg:text-xs lg:px-1"
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
