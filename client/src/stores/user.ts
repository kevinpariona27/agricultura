import { create } from "zustand";
import type { UserProfile, UpdateProfilePayload } from "@agri/shared";
import { get, put } from "../api/client";

interface UserState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: UpdateProfilePayload) => Promise<void>;
  clearError: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  loading: false,
  error: null,

  fetchProfile: async () => {
    set({ loading: true, error: null });
    try {
      const profile = await get<UserProfile>("/users/me");
      set({ profile, loading: false });
    } catch {
      set({ error: "Error al cargar el perfil", loading: false });
    }
  },

  updateProfile: async (data: UpdateProfilePayload) => {
    set({ loading: true, error: null });
    try {
      const profile = await put<UserProfile>("/users/me", data);
      set({ profile, loading: false });
    } catch {
      set({ error: "Error al actualizar el perfil", loading: false });
      throw new Error("Error al actualizar el perfil");
    }
  },

  clearError: () => set({ error: null }),
}));
