import { create } from "zustand";
import { useInventoryStore } from "./inventory";
import { useHarvestsStore } from "./harvests";
import { usePestsStore } from "./pests";

export interface NotificationItem {
  id: string;
  message: string;
  type: "warning" | "info" | "danger";
  link: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  setNotifications: (items: NotificationItem[]) => void;
  computeNotifications: () => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],

  setNotifications: (items: NotificationItem[]) => set({ notifications: items }),

  computeNotifications: () => {
    const notifs: NotificationItem[] = [];

    const items = useInventoryStore.getState().items;
    const harvests = useHarvestsStore.getState().harvests;
    const pests = usePestsStore.getState().pests;

    // Low stock: inventory items with cantidad <= 5
    for (const item of items) {
      if (item.cantidad <= 5) {
        notifs.push({
          id: `low-stock-${item.id}`,
          message: `Stock bajo: ${item.nombre} (${item.cantidad} ${item.unidad})`,
          type: "warning",
          link: "/inventory",
        });
      }
    }

    // Upcoming harvests: within 7 days
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    for (const h of harvests) {
      const harvestDate = new Date(h.fecha_cosecha + "T00:00:00");
      if (harvestDate >= now && harvestDate <= sevenDaysFromNow) {
        notifs.push({
          id: `harvest-${h.id}`,
          message: `Cosecha próxima: ${h.fecha_cosecha}`,
          type: "info",
          link: "/harvests",
        });
      }
    }

    // Active pests: pests with estado = "activo"
    for (const p of pests) {
      if (p.estado === "activo") {
        notifs.push({
          id: `pest-${p.id}`,
          message: `Plaga activa: ${p.nombre}`,
          type: "danger",
          link: "/pests",
        });
      }
    }

    set({ notifications: notifs });
  },

  clearNotifications: () => set({ notifications: [] }),
}));
