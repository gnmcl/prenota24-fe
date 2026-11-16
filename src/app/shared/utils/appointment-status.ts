import type { AppointmentStatus } from '../../core/models/domain.model';

export type AppointmentStatusVariant = 'amber' | 'green' | 'blue' | 'red' | 'gray' | 'purple';

const LABELS: Record<AppointmentStatus, string> = {
  REQUESTED: 'Da confermare',
  CONFIRMED: 'Confermato',
  PROPOSED_NEW_TIME: 'Proposta orario',
  CANCELLED: 'Cancellato',
  COMPLETED: 'Completato',
  NO_SHOW: 'Non presentato',
};

/** Dense surfaces (dashboard, agenda, professional portal) use a shorter label for the proposal state. */
const COMPACT_LABELS: Record<AppointmentStatus, string> = { ...LABELS, PROPOSED_NEW_TIME: 'Proposta' };

const VARIANTS: Record<AppointmentStatus, AppointmentStatusVariant> = {
  REQUESTED: 'amber',
  CONFIRMED: 'green',
  PROPOSED_NEW_TIME: 'blue',
  CANCELLED: 'red',
  COMPLETED: 'gray',
  NO_SHOW: 'purple',
};

/** Italian label for an appointment status; falls back to the raw value for statuses unknown to this build. */
export function appointmentStatusLabel(status: AppointmentStatus, compact = false): string {
  return (compact ? COMPACT_LABELS : LABELS)[status] ?? status;
}

/** Badge variant for an appointment status (see `<app-badge>`). */
export function appointmentStatusVariant(status: AppointmentStatus): AppointmentStatusVariant {
  return VARIANTS[status] ?? 'gray';
}
