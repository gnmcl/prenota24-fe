import type { UUID, AppUserRole } from "./domain";

/* ────────────────────────────────────────────
 * Authenticated user (subset returned by login)
 * ──────────────────────────────────────────── */

export interface AuthUser {
  id: UUID;
  email: string;
  role: AppUserRole;
  studioId: UUID;
}

/* ────────────────────────────────────────────
 * Login
 * ──────────────────────────────────────────── */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: AuthUser;
}
