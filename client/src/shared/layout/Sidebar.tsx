import { NavLink } from "react-router-dom";

export function Sidebar() {
  return (
    <aside className="flex h-full w-64 flex-col bg-green-800 text-white">
      <div className="px-6 py-5 text-xl font-bold tracking-tight">
        Gestión Agrícola
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `rounded px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-green-700 text-white"
                : "text-green-100 hover:bg-green-700 hover:text-white"
            }`
          }
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/parcels"
          className={({ isActive }) =>
            `rounded px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-green-700 text-white"
                : "text-green-100 hover:bg-green-700 hover:text-white"
            }`
          }
        >
          Parcelas
        </NavLink>
        <NavLink
          to="/crops"
          className={({ isActive }) =>
            `rounded px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-green-700 text-white"
                : "text-green-100 hover:bg-green-700 hover:text-white"
            }`
          }
        >
          Cultivos
        </NavLink>
        <NavLink
          to="/irrigations"
          className={({ isActive }) =>
            `rounded px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-green-700 text-white"
                : "text-green-100 hover:bg-green-700 hover:text-white"
            }`
          }
        >
          Riegos
        </NavLink>
        <NavLink
          to="/harvests"
          className={({ isActive }) =>
            `rounded px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-green-700 text-white"
                : "text-green-100 hover:bg-green-700 hover:text-white"
            }`
          }
        >
          Cosechas
        </NavLink>
        <NavLink
          to="/inventory"
          className={({ isActive }) =>
            `rounded px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-green-700 text-white"
                : "text-green-100 hover:bg-green-700 hover:text-white"
            }`
          }
        >
          Inventario
        </NavLink>
        <NavLink
          to="/reports"
          className={({ isActive }) =>
            `rounded px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-green-700 text-white"
                : "text-green-100 hover:bg-green-700 hover:text-white"
            }`
          }
        >
          Reportes
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `rounded px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-green-700 text-white"
                : "text-green-100 hover:bg-green-700 hover:text-white"
            }`
          }
        >
          Perfil
        </NavLink>
      </nav>

      <div className="px-3 pb-4">
        <button
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }}
          className="w-full rounded px-3 py-2 text-left text-sm font-medium text-green-200 transition-colors hover:bg-green-700 hover:text-white"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
