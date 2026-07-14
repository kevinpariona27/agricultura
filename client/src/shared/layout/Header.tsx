import { Bell, Download, Menu, User } from "lucide-react";
import { useEffect } from "react";
import { useNotificationStore } from "../../stores/notificationStore";
import { useUserStore } from "../../stores/user";
import { useSidebarStore } from "../../stores/sidebar";
import { ImageDisplay } from "../components/ImageDisplay";

export function Header() {
  const notifications = useNotificationStore((s) => s.notifications);
  const { profile, fetchProfile } = useUserStore();
  const toggle = useSidebarStore((s) => s.toggle);
  const sidebarOpen = useSidebarStore((s) => s.isOpen);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token && !profile) {
      fetchProfile();
    }
  }, [token, profile, fetchProfile]);

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
      <button className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-primary-dark transition-colors duration-200 hover:bg-primary-50">
        <Download className="h-4 w-4" />
        Descargar PDF
      </button>
      {token && (
        <ImageDisplay
          src={profile?.avatar_url ?? null}
          alt="Avatar de usuario"
          size="sm"
          fallbackIcon={User}
          rounded={true}
        />
      )}
      <button className="relative cursor-pointer rounded-lg p-2 transition-colors duration-200 hover:bg-primary-50">
        <Bell className="h-5 w-5 text-primary-dark/70" />
        {notifications > 0 && (
          <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-primary-light" />
        )}
      </button>
    </header>
  );
}
