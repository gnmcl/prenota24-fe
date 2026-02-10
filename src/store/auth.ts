import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "../types";

/* ────────────────────────────────────────────
 * Auth state
 *
 * Separate from SetupStore.
 * Persisted under its own localStorage key so a
 * page refresh keeps the user logged in.
 * ──────────────────────────────────────────── */

interface AuthState {
  /** JWT access token */
  accessToken: string | null;
  /** Authenticated user profile */
  user: AuthUser | null;

  /** Derived convenience getter */
  isAuthenticated: boolean;

  /** Store token + user after successful login */
  login: (accessToken: string, user: AuthUser) => void;
  /** Clear everything on logout or 401 */
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,

      login: (accessToken, user) =>
        set({ accessToken, user, isAuthenticated: true }),

      logout: () =>
        set({ accessToken: null, user: null, isAuthenticated: false }),
    }),
    { name: "prenota24-auth" },
  ),
);
