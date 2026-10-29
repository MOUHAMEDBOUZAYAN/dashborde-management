import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { AUTH_BYPASS } from "@/config/constants";
import type { Client } from "@/types";

type AuthState = {
  token: string | null;
  client: Client | null;
  isAuthenticated: boolean;
  setAuth: (token: string) => void;
  setClient: (client: Client) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      client: null,
      isAuthenticated: false,
      setAuth: (token) => set({ token, isAuthenticated: true }),
      setClient: (client) => set({ client }),
      logout: () => {
        // Keep designing without bouncing to /login while bypass is on.
        if (AUTH_BYPASS) {
          if (typeof window === "undefined") return;
          if (!window.location.pathname.startsWith("/dashboard")) {
            window.location.replace("/dashboard");
          }
          return;
        }

        set({ token: null, client: null, isAuthenticated: false });

        if (typeof window === "undefined") return;
        if (window.location.pathname !== "/login") {
          window.location.replace("/login");
        }
      },
    }),
    {
      name: "client-portal-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        client: state.client,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
