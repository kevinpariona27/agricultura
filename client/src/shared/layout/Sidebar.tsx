import { NavLink } from "react-router-dom";
import { FileText } from "lucide-react";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/parcels", label: "Parcelas" },
  { to: "/crops", label: "Cultivos" },
  { to: "/irrigations", label: "Riegos" },
  { to: "/harvests", label: "Cosechas" },
  { to: "/inventory", label: "Inventario" },
  { to: "/reports", label: "Reportes" },
  { to: "/profile", label: "Perfil" },
] as const;

export function Sidebar() {
  return (
    <aside className="flex h-full w-64 flex-col bg-slate-900 text-white">
      <div className="border-b border-slate-700 px-6 py-5 text-xl font-bold tracking-tight">
        Gestión Agrícola
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "border-l-4 border-emerald-400 bg-emerald-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-slate-700 bg-slate-800/50 px-6 py-4">
        <button className="mb-3 flex w-full items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2.5 font-medium text-gray-900 transition-colors hover:bg-emerald-300">
          <FileText className="h-5 w-5" />
          Nuevo Reporte
        </button>
        <button
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }}
          className="w-full rounded px-3 py-2 text-left text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
