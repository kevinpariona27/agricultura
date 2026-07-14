import { create } from "zustand";

type ThemeMode = "light" | "dark" | "auto";

interface ThemeState {
  mode: ThemeMode;
  /** Manual toggle override (null = auto, boolean = forced) */
  manualOverride: boolean | null;
  /** Current effective theme (light or dark) */
  effective: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
  syncAuto: () => void;
}

function getTimeBasedTheme(): "light" | "dark" {
  const hour = new Date().getHours();
  // Dark mode: 18:00 - 06:00, Light mode: 06:00 - 18:00
  return hour >= 18 || hour < 6 ? "dark" : "light";
}

function getStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem("theme-mode");
    if (stored === "light" || stored === "dark" || stored === "auto") {
      return stored;
    }
  } catch {
    // ignore
  }
  return "auto";
}

function getStoredOverride(): boolean | null {
  try {
    const stored = localStorage.getItem("theme-override");
    if (stored === "true") return true;
    if (stored === "false") return false;
  } catch {
    // ignore
  }
  return null;
}

function applyThemeClass(effective: "light" | "dark"): void {
  const root = document.documentElement;
  if (effective === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

function resolveEffective(mode: ThemeMode, manual: boolean | null): "light" | "dark" {
  if (manual !== null) {
    return manual ? "dark" : "light";
  }
  if (mode === "auto") {
    return getTimeBasedTheme();
  }
  return mode;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: getStoredMode(),
  manualOverride: getStoredOverride(),
  effective: resolveEffective(getStoredMode(), getStoredOverride()),

  setMode: (mode: ThemeMode) => {
    localStorage.setItem("theme-mode", mode);
    if (mode !== "auto") {
      // Explicit mode clears manual override
      localStorage.removeItem("theme-override");
      const effective = mode as "light" | "dark";
      applyThemeClass(effective);
      set({ mode, manualOverride: null, effective });
    } else {
      // Auto mode: use time-based
      const effective = getTimeBasedTheme();
      applyThemeClass(effective);
      set({ mode, manualOverride: null, effective });
    }
  },

  toggle: () => {
    const { effective } = get();
    const newOverride = effective === "dark" ? false : true;
    localStorage.setItem("theme-override", String(newOverride));
    const newEffective = newOverride ? "dark" : "light";
    applyThemeClass(newEffective);
    set({ manualOverride: newOverride, mode: "auto", effective: newEffective });
  },

  syncAuto: () => {
    const { mode, manualOverride } = get();
    if (mode === "auto" && manualOverride === null) {
      const newEffective = getTimeBasedTheme();
      applyThemeClass(newEffective);
      set({ effective: newEffective });
    }
  },
}));

// Apply initial theme on module load
applyThemeClass(resolveEffective(getStoredMode(), getStoredOverride()));

// Periodic sync for auto mode (every 5 minutes)
setInterval(() => {
  useThemeStore.getState().syncAuto();
}, 5 * 60 * 1000);
