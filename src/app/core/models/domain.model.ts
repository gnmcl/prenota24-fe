/**
 * Branded UUID type for type-safety across the application.
 */
export type UUID = string & { readonly __brand: 'UUID' };

/**
 * Roles available within a Studio tenant.
 */
export const APP_USER_ROLES = ['ADMIN', 'PROFESSIONAL'] as const;
export type AppUserRole = (typeof APP_USER_ROLES)[number];

/* ── Studio ─────────────────────────────── */

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

/* ── AppUser ────────────────────────────── */

export interface AppUser {
  id: UUID;
  studioId: UUID;
  email: string;
  name: string | null;
  role: AppUserRole;
  active: boolean;
}

export interface CreateAppUserRequest {
  studioId: UUID;
  email: string;
  password: string;
  role: AppUserRole;
}

/* ── Event ──────────────────────────────── */

export const EVENT_STATUSES = ['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const RESERVATION_STATUSES = ['CONFIRMED', 'CANCELLED'] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export interface EventResponse {
  id: UUID;
  title: string;
  description: string | null;
  slug: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string | null;
  maxParticipants: number | null;
  currentParticipants: number;
  status: EventStatus;
  shareLink: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventSummaryResponse {
  id: UUID;
  title: string;
  slug: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string | null;
  maxParticipants: number | null;
  currentParticipants: number;
  status: EventStatus;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location?: string;
  maxParticipants?: number | null;
}

/* ── Reservation ────────────────────────── */

export interface ReservationResponse {
  id: UUID;
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  notes: string | null;
  status: ReservationStatus;
  createdAt: string;
}

export interface CreateReservationRequest {
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  notes?: string;
}

/* ── API Error Shape ────────────────────── */

export interface ApiErrorResponse {
  status: number;
  message: string;
  errors?: Record<string, string>;
}
