import axios from "axios";
import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import type { ApiErrorResponse } from "../types";
import { useAuthStore } from "../store/auth";

/**
 * Pre-configured Axios instance pointing at the backend API.
 * All service modules import this single instance so headers,
 * interceptors, and base URL are managed in one place.
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15_000,
});

/* ────────────────────────────────────────────
 * Request interceptor – attach JWT
 * ──────────────────────────────────────────── */

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
);

/* ────────────────────────────────────────────
 * Response interceptor – normalise errors + handle 401
 * ──────────────────────────────────────────── */

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      // 401 → token expired or invalid → force logout
      if (status === 401) {
        useAuthStore.getState().logout();
        window.location.href = "/login";
        return Promise.reject(data);
      }

      const normalised: ApiErrorResponse = {
        status,
        message: data?.message ?? error.message,
        errors: data?.errors,
      };
      return Promise.reject(normalised);
    }

    // Network / timeout errors
    const normalised: ApiErrorResponse = {
      status: 0,
      message: error.message || "Network error – please check your connection.",
    };
    return Promise.reject(normalised);
  },
);

export default apiClient;
