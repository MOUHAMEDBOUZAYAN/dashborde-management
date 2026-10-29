import axios from "axios";
import { API_BASE_URL, AUTH_BYPASS } from "@/config/constants";
import { useAuthStore } from "@/store/auth-store";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Bypass mode uses mock data — never force-logout on 401.
      if (AUTH_BYPASS) {
        return Promise.reject(error);
      }

      const url = error.config?.url ?? "";
      const isLoginRequest = url.includes("/client-auth/login");
      const { token, logout } = useAuthStore.getState();

      // A failed login stays on the form so the inline error can show.
      if (!isLoginRequest && token) {
        logout();
      }
    }

    return Promise.reject(error);
  },
);
