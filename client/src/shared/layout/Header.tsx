import { Bell, ChevronRight, FileText, Menu, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useNotificationStore } from "../../stores/notificationStore";
import { useUserStore } from "../../stores/user";
import { useSidebarStore } from "../../stores/sidebar";
import { ImageDisplay } from "../components/ImageDisplay";
import { NotificationDropdown } from "../components/NotificationDropdown";
import { exportTableToPDF } from "../utils/exportPDF";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  parcels: "Parcelas",
  crops: "Cultivos",
  pests: "Plagas",
  inventory: "Inventario",
  costs: "Costos",
  map: "Mapa",
  reports: "Reportes",
  calendar: "Calendario",
  legal: "Cuaderno",
  alerts: "Alertas",
};

export function Header() {
  const notifications = useNotificationStore((s) => s.notifications);
  const computeNotifications = useNotificationStore(
    (s) => s.computeNotifications
  );
  const { profile, fetchProfile } = useUserStore();
  const toggle = useSidebarStore((s) => s.toggle);
  const sidebarOpen = useSidebarStore((s) => s.isOpen);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);

  const breadcrumbs = useMemo(() => {
    const segments = location.pathname.split("/").filter(Boolean);
    return segments.map((seg) => ROUTE_LABELS[seg] ?? seg);
  }, [location.pathname]);

  useEffect(() => {
    if (token && !profile) {
      fetchProfile();
    }
  }, [token, profile, fetchProfile]);

  // Compute notifications on mount and periodically
  useEffect(() => {
    computeNotifications();
    const interval = setInterval(computeNotifications, 60000);
    return () => clearInterval(interval);
  }, [computeNotifications]);

  return (
    <header
      className="flex w-full items-center gap-4 border-b border-border bg-white/80 px-4 py-3 backdrop-blur-sm sm:px-8 sm:py-4"
      data-testid="header"
      role="banner"
    >
      {/* Hamburger button — visible only on mobile/tablet */}
      <button
        onClick={toggle}
        className="rounded-lg p-2 text-primary-dark/70 transition-colors duration-200 hover:bg-primary-50 lg:hidden"
        aria-label="Toggle navigation"
        aria-expanded={sidebarOpen ? "true" : "false"}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="hidden sm:flex items-center gap-1.5 text-sm text-gray-400" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, i) => {
            const isLast = i === breadcrumbs.length - 1;
            return (
              <span key={crumb} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-gray-300" />}
                <span className={isLast ? "text-gray-600 font-medium" : ""}>
                  {crumb}
                </span>
              </span>
            );
          })}
        </nav>
      )}

      <div className="flex-1" />
      <button
        onClick={() =>
          exportTableToPDF(
            "Panel General",
            [
              { header: "Tipo", dataKey: "type" },
              { header: "Mensaje", dataKey: "message" },
            ],
            notifications.map((n) => ({
              type: n.type ?? "",
              message: n.message ?? "",
            })),
            "dashboard"
          )
        }
        className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-primary-dark transition-colors duration-200 hover:bg-primary-50"
      >
        <FileText className="h-4 w-4" />
        Descargar PDF
      </button>
      {token && (
        <button
          onClick={() => navigate("/profile")}
          className="cursor-pointer rounded-full transition-opacity hover:opacity-80 focus:outline-none"
          aria-label="Ir al perfil"
        >
          <ImageDisplay
            src={profile?.avatar_url ?? null}
            alt="Avatar de usuario"
            size="sm"
            fallbackIcon={User}
            rounded={true}
          />
        </button>
      )}
      <div className="relative">
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className="relative cursor-pointer rounded-lg p-2 transition-colors duration-200 hover:bg-primary-50"
          aria-label="Notificaciones"
        >
          <Bell className="h-5 w-5 text-primary-dark/70" />
          {notifications.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-bold text-white">
              {notifications.length > 99 ? "99+" : notifications.length}
            </span>
          )}
        </button>
        <NotificationDropdown isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
      </div>
    </header>
  );
}
