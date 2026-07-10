import { Bell, Download, User } from "lucide-react";
import { useEffect } from "react";
import { useNotificationStore } from "../../stores/notificationStore";
import { useUserStore } from "../../stores/user";
import { ImageDisplay } from "../components/ImageDisplay";

export function Header() {
  const notifications = useNotificationStore((s) => s.notifications);
  const { profile, fetchProfile } = useUserStore();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token && !profile) {
      fetchProfile();
    }
  }, [token, profile, fetchProfile]);

  return (
    <header
      className="flex w-full items-center gap-4 px-8 py-4 dark:bg-gray-900 dark:text-gray-100"
      data-testid="header"
      role="banner"
    >
      <div className="flex-1" />
      <button className="flex items-center gap-2 rounded-lg border border-white/15 bg-transparent px-4 py-2 text-sm text-zinc-200 transition-colors hover:bg-white/5 dark:border-gray-700 dark:hover:bg-gray-800">
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
      <button className="relative rounded-lg p-2 transition-colors hover:bg-white/5 dark:hover:bg-gray-800">
        <Bell className="h-5 w-5 text-zinc-300" />
        {notifications > 0 && (
          <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />
        )}
      </button>
    </header>
  );
}
