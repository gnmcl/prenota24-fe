import axios from "axios";
import type { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import type { ApiErrorResponse } from "../types";

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
 * Response interceptor – normalise errors
 * ──────────────────────────────────────────── */

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    // Attach a friendlier shape that callers can inspect
    if (error.response) {
      const data = error.response.data;
      const normalised: ApiErrorResponse = {
        status: error.response.status,
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
