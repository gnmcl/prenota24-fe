import type { UUID, AppUserRole } from './domain.model';

/* ── Authenticated user ─────────────────── */

export interface AuthUser {
  id: UUID;
  email: string;
  name: string | null;
  role: AppUserRole;
  studioId: UUID;
  professionalId: UUID | null;
}

/* ── Login ──────────────────────────────── */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

/* ── Register ───────────────────────────── */

export interface RegisterRequest {
  name: string;
  studioName: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  email: string;
  message: string;
}

/* ── Email verification ─────────────────── */

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface ResendVerificationRequest {
  email: string;
}

/* ── Invitation ──────────────────────────── */

export interface AcceptInvitationRequest {
  token: string;
  name: string;
  password: string;
}

export interface InvitationInfo {
  professionalName: string;
  studioName: string;
  email: string;
  status: string;
}
