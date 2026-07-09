import { create } from "zustand";
import type { UserProfile, UpdateProfilePayload } from "@agri/shared";
import { get, put, uploadFile, removeImage } from "../api/client";

interface UserState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: UpdateProfilePayload) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  removeAvatar: () => Promise<void>;
  clearError: () => void;
}

export const useUserStore = create<UserState>((set, storeGet) => ({
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

  uploadAvatar: async (file: File) => {
    const { profile } = storeGet();
    if (!profile) throw new Error("No profile loaded");

    set({ loading: true, error: null });
    try {
      const updatedProfile = await uploadFile<UserProfile>(
        "users",
        profile.id,
        file,
      );
      set({ profile: updatedProfile, loading: false });
    } catch {
      set({ error: "Error al subir el avatar", loading: false });
      throw new Error("Error al subir el avatar");
    }
  },

  removeAvatar: async () => {
    const { profile } = storeGet();
    if (!profile) throw new Error("No profile loaded");

    set({ loading: true, error: null });
    try {
      const updatedProfile = await removeImage<UserProfile>(
        "users",
        profile.id,
      );
      set({ profile: updatedProfile, loading: false });
    } catch {
      set({ error: "Error al eliminar el avatar", loading: false });
      throw new Error("Error al eliminar el avatar");
    }
  },

  clearError: () => set({ error: null }),
}));
