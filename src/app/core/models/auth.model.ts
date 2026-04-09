import type { UUID, AppUserRole } from './domain.model';

/* ── Authenticated user ─────────────────── */

export interface AuthUser {
  id: UUID;
  email: string;
  name: string | null;
  role: AppUserRole;
  studioId: UUID;
}

/* ── Login ──────────────────────────────── */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

/* ── Register ───────────────────────────── */

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  accessToken: string;
  user: AuthUser;
}
