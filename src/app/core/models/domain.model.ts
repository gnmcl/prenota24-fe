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

export interface EditStudioRequest {
  name?: string;
  email?: string;
  phone?: string;
  timezone?: string;
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
  error?: string;
  message: string;
  errors?: Record<string, string>;
}

/* ── Professional ───────────────────────── */

export interface ProfessionalResponse {
  id: UUID;
  studioId: UUID;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  active: boolean;
  createdAt: string;
}

export interface CreateProfessionalRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

export interface UpdateProfessionalRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  active?: boolean;
}

/* ── Availability ───────────────────────── */

export interface AvailabilityResponse {
  id: UUID;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface AvailabilitySlotRequest {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface AvailabilityExceptionResponse {
  id: UUID;
  date: string;
  isUnavailable: boolean;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

export interface CreateAvailabilityExceptionRequest {
  date: string;
  isUnavailable: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

/* ── Client ─────────────────────────────── */

export const CLIENT_SOURCES = ['MANUAL', 'RESERVATION_IMPORT', 'PUBLIC_BOOKING', 'API'] as const;
export type ClientSource = (typeof CLIENT_SOURCES)[number];

export interface ClientResponse {
  id: UUID;
  studioId: UUID;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  source: ClientSource;
  tags: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientSummaryResponse {
  id: UUID;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
}

export interface CreateClientRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  notes?: string;
  tags?: string[];
}

export interface UpdateClientRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  notes?: string;
  tags?: string[];
}

/* ── Client Note ────────────────────────── */

export interface ClientNoteResponse {
  id: UUID;
  clientId: UUID;
  authorId: UUID;
  authorName: string | null;
  appointmentId: UUID | null;
  content: string;
  pinned: boolean;
  createdAt: string;
}

export interface CreateClientNoteRequest {
  content: string;
  appointmentId?: UUID;
  pinned?: boolean;
}

/* ── Service Type ───────────────────────── */

export interface ServiceTypeResponse {
  id: UUID;
  studioId: UUID;
  professionalIds: UUID[];
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number | null;
  color: string | null;
  active: boolean;
  createdAt: string;
}

export interface CreateServiceTypeRequest {
  name: string;
  description?: string;
  durationMinutes: number;
  price?: number;
  color?: string;
  professionalIds?: UUID[];
}

/* ── Appointment ────────────────────────── */

export const APPOINTMENT_STATUSES = ['REQUESTED', 'CONFIRMED', 'PROPOSED_NEW_TIME', 'CANCELLED', 'COMPLETED', 'NO_SHOW'] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const CANCELLED_BY = ['CLIENT', 'PROFESSIONAL', 'SYSTEM'] as const;
export type CancelledBy = (typeof CANCELLED_BY)[number];

export interface AppointmentResponse {
  id: UUID;
  studioId: UUID;
  professionalId: UUID;
  professionalFullName: string;
  clientId: UUID;
  clientFullName: string;
  serviceTypeId: UUID | null;
  serviceTypeName: string | null;
  serviceTypeColor: string | null;
  startDatetime: string;
  endDatetime: string;
  status: AppointmentStatus;
  notes: string | null;
  proposedStart: string | null;
  proposedEnd: string | null;
  cancellationReason: string | null;
  cancelledBy: CancelledBy | null;
  token: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentRequest {
  professionalId: UUID;
  clientId: UUID;
  serviceTypeId?: UUID;
  startDatetime: string;
  endDatetime: string;
  notes?: string;
  confirmImmediately?: boolean;
}

export interface UpdateAppointmentRequest {
  notes?: string;
  serviceTypeId?: UUID;
  startDatetime?: string;
  endDatetime?: string;
  professionalId?: UUID;
}

export interface ProposeNewTimeRequest {
  proposedStart: string;
  proposedEnd: string;
}

export interface CancelAppointmentRequest {
  reason?: string;
}

/* ── Time Slot ──────────────────────────── */

export interface TimeSlotResponse {
  start: string;
  end: string;
}

/* ── Paginated Response ─────────────────── */

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

/* ── Invitation ────────────────────────── */

export interface InvitationResponse {
  id: UUID;
  professionalId: UUID;
  professionalName: string;
  email: string;
  status: string;
  inviteLink: string;
  expiresAt: string;
  createdAt: string;
}

export interface CreateInvitationRequest {
  professionalId: UUID;
  email: string;
}

/* ── Professional Dashboard ────────────── */

export interface ProfessionalDashboardResponse {
  professional: ProfessionalResponse;
  studio: Studio;
  todayAppointments: number;
  totalClients: number;
  pendingAppointments: number;
}
