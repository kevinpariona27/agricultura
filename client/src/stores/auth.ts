import { create } from "zustand";
import type { User } from "@agri/shared";
import { post } from "../api/client.js";

interface AuthState {
  user: User | null;
  token: string | null;
  role: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem("token"),
  role: null,

  login: async (email: string, password: string) => {
    const data = await post<{ token: string; user: User }>(
      "/auth/login",
      { email, password }
    );
    localStorage.setItem("token", data.token);
    set({ user: data.user, token: data.token, role: data.user.role ?? null });
  },

  register: async (email: string, password: string) => {
    await post<{ id: number; email: string }>(
      "/auth/register",
      { email, password }
    );
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, token: null, role: null });
  },
}));

/** Hook to get current user role */
export function useUserRole(): string | null {
  return useAuthStore((s) => s.role);
}
