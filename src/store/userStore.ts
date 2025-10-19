import api from "@/lib/axios";
import { create } from "zustand";

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserState {
  isLogedIn: boolean;
  setIsLogedIn: (isLogedIn: boolean) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  isLogedIn: false,
  setIsLogedIn: (isLogedIn) => set({ isLogedIn }),
  user: null,
  setUser: (user) => set({ user }),
  logout: async () => {
    try {
      await api.post("/api/auth/logout");
      set({ user: null, isLogedIn: false });
    } catch (err) {
      console.error("Logout failed:", err);
    }
  },
}));
