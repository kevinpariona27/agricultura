import { Bell, Download, Menu, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotificationStore } from "../../stores/notificationStore";
import { useUserStore } from "../../stores/user";
import { useSidebarStore } from "../../stores/sidebar";
import { ImageDisplay } from "../components/ImageDisplay";
import { NotificationDropdown } from "../components/NotificationDropdown";

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
  const [notifOpen, setNotifOpen] = useState(false);

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
      className="flex w-full items-center gap-4 px-4 sm:px-8 py-3 sm:py-4"
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

      <div className="flex-1" />
      <button onClick={() => window.print()} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-primary-dark transition-colors duration-200 hover:bg-primary-50">
        <Download className="h-4 w-4" />
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
            <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-primary-light" />
          )}
        </button>
        <NotificationDropdown isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
      </div>
    </header>
  );
}
