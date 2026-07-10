import { Link, useLocation } from "react-router-dom";
import { Sprout } from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle.js";

export function AuthNavbar() {
  const { pathname } = useLocation();

  const isLogin = pathname === "/login";
  const ctaLabel = isLogin ? "Registrarse" : "Iniciar sesión";
  const ctaTo = isLogin ? "/register" : "/login";

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 flex h-[60px] items-center justify-between bg-white px-6 shadow-sm">
      <Link to="/" className="flex items-center gap-2 text-lg font-bold text-gray-800">
        <Sprout className="h-6 w-6 text-emerald-600" />
        <span>AgroExec</span>
      </Link>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Link
          to={ctaTo}
          className="rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:from-purple-600 hover:to-purple-700"
        >
          {ctaLabel}
        </Link>
      </div>
    </nav>
  );
}
