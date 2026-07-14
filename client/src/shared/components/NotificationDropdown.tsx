import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Info, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { NotificationItem } from "../../stores/notificationStore";
import { useNotificationStore } from "../../stores/notificationStore";

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  warning: AlertTriangle,
  info: Info,
  danger: AlertCircle,
};

const COLOR_MAP: Record<string, string> = {
  warning: "text-amber-500",
  info: "text-blue-500",
  danger: "text-red-500",
};

export function NotificationDropdown({
  isOpen,
  onClose,
}: NotificationDropdownProps) {
  const navigate = useNavigate();
  const notifications = useNotificationStore((s) => s.notifications);

  function handleClick(notif: NotificationItem) {
    onClose();
    navigate(notif.link);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-surface shadow-lg"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-primary-dark">
              Notificaciones
            </h3>
            <button
              onClick={onClose}
              className="cursor-pointer rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-primary-dark"
              aria-label="Cerrar notificaciones"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Notification list */}
          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No hay notificaciones nuevas
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((notif) => {
                const Icon = ICON_MAP[notif.type] ?? Info;
                const color = COLOR_MAP[notif.type] ?? "text-blue-500";
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    className="flex w-full cursor-pointer items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-muted/50"
                  >
                    <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} />
                    <span className="text-sm text-primary-dark">
                      {notif.message}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
