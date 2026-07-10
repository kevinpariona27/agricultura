import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AuthNavbar } from "./AuthNavbar.js";

export function AuthLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <AuthNavbar />
      <main className="flex min-h-screen items-center justify-center px-4 pt-[60px] pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="flex w-full flex-col items-center"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
