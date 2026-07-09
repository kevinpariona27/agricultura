import { create } from "zustand";

interface NotificationState {
  notifications: number;
  setNotifications: (count: number) => void;
  increment: () => void;
  decrement: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: 0,
  setNotifications: (count: number) => set({ notifications: count }),
  increment: () => set((state) => ({ notifications: state.notifications + 1 })),
  decrement: () =>
    set((state) => ({ notifications: Math.max(0, state.notifications - 1) })),
}));
