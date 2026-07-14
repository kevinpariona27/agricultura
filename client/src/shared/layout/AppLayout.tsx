import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "./Sidebar.js";
import { Header } from "./Header.js";
import { useSidebarStore } from "../../stores/sidebar.js";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts.js";
import { OfflineBanner } from "../components/OfflineBanner.js";

export function AppLayout() {
  const location = useLocation();
  const close = useSidebarStore((s) => s.close);

  // Enable global keyboard shortcuts
  useKeyboardShortcuts();

  // Auto-close sidebar on route change (mobile overlay navigation)
  useEffect(() => {
    close();
  }, [location.pathname, close]);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <OfflineBanner />
        <main className="flex-1 overflow-auto bg-app-bg p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
        <footer className="border-t border-border bg-surface px-4 py-3 text-center text-xs text-muted-foreground">
          Gestión Agrícola v2.0 © 2026 — Ayacucho, Perú
        </footer>
      </div>
    </div>
  );
}
