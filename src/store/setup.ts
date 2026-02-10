import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppUser, Studio } from "../types";

/* ────────────────────────────────────────────
 * Onboarding / setup state
 *
 * Persisted to localStorage so a page refresh
 * during the setup wizard does not lose progress.
 * ──────────────────────────────────────────── */

interface SetupState {
  /** The Studio created during onboarding */
  studio: Studio | null;
  /** The admin user created during onboarding */
  adminUser: AppUser | null;
  /** Whether the full setup flow has been completed */
  setupComplete: boolean;

  setStudio: (studio: Studio) => void;
  setAdminUser: (user: AppUser) => void;
  completeSetup: () => void;
  reset: () => void;
}

export const useSetupStore = create<SetupState>()(
  persist(
    (set) => ({
      studio: null,
      adminUser: null,
      setupComplete: false,

      setStudio: (studio) => set({ studio }),
      setAdminUser: (user) => set({ adminUser: user }),
      completeSetup: () => set({ setupComplete: true }),
      reset: () => set({ studio: null, adminUser: null, setupComplete: false }),
    }),
    { name: "prenota24-setup" },
  ),
);
