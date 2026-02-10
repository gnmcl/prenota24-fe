/**
 * Branded UUID type for type-safety across the application.
 * Prevents accidental mixing of raw strings where UUIDs are expected.
 */
export type UUID = string & { readonly __brand: "UUID" };

/**
 * Roles available within a Studio tenant.
 */
export const APP_USER_ROLES = ["ADMIN", "PROFESSIONAL"] as const;
export type AppUserRole = (typeof APP_USER_ROLES)[number];

/* ────────────────────────────────────────────
 * Studio
 * ──────────────────────────────────────────── */

export interface Studio {
  id: UUID;
  name: string;
  email: string | null;
  phone: string | null;
  timezone: string;
}

export interface CreateStudioRequest {
  name: string;
  email?: string;
  phone?: string;
}

/* ────────────────────────────────────────────
 * AppUser
 * ──────────────────────────────────────────── */

export interface AppUser {
  id: UUID;
  studioId: UUID;
  email: string;
  role: AppUserRole;
  active: boolean;
}

export interface CreateAppUserRequest {
  studioId: UUID;
  email: string;
  password: string;
  role: AppUserRole;
}

/* ────────────────────────────────────────────
 * API Error Shape
 * ──────────────────────────────────────────── */

export interface ApiErrorResponse {
  status: number;
  message: string;
  errors?: Record<string, string>;
}
