import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDropdown({
  isOpen,
  onClose,
}: NotificationDropdownProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-border bg-surface shadow-lg"
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

          {/* Empty state */}
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            No hay notificaciones nuevas
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
