import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// Fade out splash screen when React mounts
const splash = document.getElementById("splash");
if (splash) {
  // Small delay to ensure React root renders first paint
  setTimeout(() => {
    splash.classList.add("fade-out");
    setTimeout(() => splash.remove(), 400);
  }, 100);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
