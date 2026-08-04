import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PublicBookingService } from '../../core/services/public-booking.service';
import { getErrorMessage } from '../../shared/utils/errors';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import type { AppointmentResponse } from '../../core/models/domain.model';

interface ProposedSlot {
  start: string;
  end: string;
  label: string;
}

type ProposalViewState = 'pending' | 'accepted' | 'rejected' | 'unavailable';

@Component({
  selector: 'app-public-booking-confirm',
  standalone: true,
  imports: [RouterLink, CardComponent, ButtonComponent, AlertComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 px-4 sm:px-6 py-5 sm:py-8">
      <div class="mx-auto w-full max-w-2xl">
        @if (loading()) {
          <app-card>
            <div class="flex flex-col items-center py-10">
              <div class="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
              <p class="text-sm text-gray-500">Caricamento proposta orario...</p>
            </div>
          </app-card>
        } @else if (error() && !appointment()) {
          <app-card>
            <div class="py-6 text-center">
              <h2 class="mb-2 text-xl font-bold text-gray-900">Link non valido</h2>
              <p class="text-sm text-gray-500">{{ error() }}</p>
            </div>
          </app-card>
        } @else if (viewState() === 'accepted' && appointment()) {
          <app-card extraClass="text-center">
            <div class="py-4">
              <div class="mb-4 text-5xl">✅</div>
              <h2 class="mb-2 text-xl font-bold text-gray-900">Appuntamento confermato</h2>
              <p class="mx-auto mb-4 max-w-md text-sm text-gray-500">
                Hai confermato il tuo appuntamento con
                <strong>{{ appointment()!.professionalFullName }}</strong>.
              </p>
              <div class="mx-auto inline-flex rounded-lg bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700">
                📅 {{ formatFull(appointment()!.startDatetime) }} – {{ formatTime(appointment()!.endDatetime) }}
              </div>
              @if (appointment()!.studioSlug) {
                <div class="mt-6 flex justify-center">
                  <a [routerLink]="['/prenota', appointment()!.studioSlug]">
                    <app-button variant="secondary" extraClass="w-full sm:w-auto">Vai alla pagina prenotazioni</app-button>
                  </a>
                </div>
              }
            </div>
          </app-card>
        } @else if (viewState() === 'rejected' && appointment()) {
          <app-card extraClass="text-center">
            <div class="py-4">
              <div class="mb-4 text-5xl">↩️</div>
              <h2 class="mb-2 text-xl font-bold text-gray-900">Proposte rifiutate</h2>
              <p class="mx-auto mb-4 max-w-md text-sm text-gray-500">
                Nessuna delle proposte disponibili è stata accettata.
                L'appuntamento è di nuovo in attesa di conferma.
              </p>
              @if (appointment()?.studioSlug) {
                <div class="mt-6 flex justify-center">
                  <a [routerLink]="['/prenota', appointment()!.studioSlug]">
                    <app-button variant="secondary" extraClass="w-full sm:w-auto">Vai alla pagina prenotazioni</app-button>
                  </a>
                </div>
              }
            </div>
          </app-card>
        } @else if (viewState() === 'unavailable') {
          <app-card extraClass="text-center">
            <div class="py-4">
              <h2 class="mb-2 text-xl font-bold text-gray-900">Proposta non disponibile</h2>
              <p class="text-sm text-gray-500">La proposta è già stata gestita oppure l'appuntamento non è più attivo.</p>
            </div>
          </app-card>
        } @else if (appointment()) {
          <app-card>
            <h1 class="text-xl font-bold text-gray-900">Lo studio ha proposto un nuovo orario</h1>
            <p class="mt-1 text-sm text-gray-500">
              {{ appointment()!.professionalFullName }} ha proposto un nuovo orario per il tuo appuntamento.
            </p>

            <!-- Appuntamento attuale -->
            <div class="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 sm:p-4 text-sm">
              <p class="font-medium text-gray-600">Appuntamento attuale</p>
              <p class="mt-1 text-gray-900 font-semibold">
                {{ formatFull(appointment()!.startDatetime) }} – {{ formatTime(appointment()!.endDatetime) }}
              </p>
            </div>

            <!-- Slot proposti -->
            <div class="mt-4">
              <p class="text-sm font-medium text-gray-700 mb-2">Scegli uno dei seguenti orari:</p>
              <div class="space-y-2">
                @for (slot of proposedSlots(); track slot.start) {
                  <label
                    class="flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors"
                    [class.border-indigo-400]="selectedSlot()?.start === slot.start"
                    [class.bg-indigo-50]="selectedSlot()?.start === slot.start"
                    [class.border-gray-200]="selectedSlot()?.start !== slot.start"
                    [class.bg-white]="selectedSlot()?.start !== slot.start"
                  >
                    <input
                      type="radio"
                      name="proposedSlot"
                      [value]="slot.start"
                      [checked]="selectedSlot()?.start === slot.start"
                      (change)="selectedSlot.set(slot)"
                      class="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <span class="text-sm font-medium text-gray-900">{{ slot.label }}</span>
                  </label>
                }
              </div>
            </div>

            @if (error()) {
              <div class="mt-4">
                <app-alert variant="error" [message]="error()!" (dismiss)="error.set(null)" />
              </div>
            }

            <div class="mt-6 flex flex-col gap-3 sm:flex-row">
              <app-button
                variant="primary"
                extraClass="w-full sm:w-auto"
                [isLoading]="actionLoading() === 'accept'"
                [disabled]="actionLoading() !== null || selectedSlot() === null"
                (click)="onConfirm()"
              >
                Conferma scelta
              </app-button>
              <app-button
                variant="secondary"
                extraClass="w-full sm:w-auto"
                [isLoading]="actionLoading() === 'reject'"
                [disabled]="actionLoading() !== null"
                (click)="onReject()"
              >
                Nessun orario va bene
              </app-button>
            </div>
          </app-card>
        }
      </div>
    </div>
  `,
})
export class PublicBookingConfirmComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly bookingService = inject(PublicBookingService);

  private token = '';

  readonly loading = signal(true);
  readonly actionLoading = signal<'accept' | 'reject' | null>(null);
  readonly error = signal<string | null>(null);
  readonly appointment = signal<AppointmentResponse | null>(null);
  readonly outcome = signal<'accepted' | 'rejected' | null>(null);
  readonly selectedSlot = signal<ProposedSlot | null>(null);

  readonly proposedSlots = computed<ProposedSlot[]>(() => {
    const apt = this.appointment();
    if (!apt) return [];
    const slots: ProposedSlot[] = [];
    if (apt.proposedStart && apt.proposedEnd) {
      slots.push({ start: apt.proposedStart, end: apt.proposedEnd, label: this.formatSlotLabel(apt.proposedStart, apt.proposedEnd) });
    }
    if (apt.proposedStart2 && apt.proposedEnd2) {
      slots.push({ start: apt.proposedStart2, end: apt.proposedEnd2, label: this.formatSlotLabel(apt.proposedStart2, apt.proposedEnd2) });
    }
    if (apt.proposedStart3 && apt.proposedEnd3) {
      slots.push({ start: apt.proposedStart3, end: apt.proposedEnd3, label: this.formatSlotLabel(apt.proposedStart3, apt.proposedEnd3) });
    }
    return slots;
  });

  readonly viewState = computed<ProposalViewState>(() => {
    const outcome = this.outcome();
    if (outcome) return outcome;

    const appointment = this.appointment();
    if (appointment?.status === 'CONFIRMED') return 'accepted';
    if (appointment?.status === 'REQUESTED' && this.proposedSlots().length === 0) return 'rejected';
    if (appointment?.status === 'PROPOSED_NEW_TIME' && this.proposedSlots().length > 0) return 'pending';
    return 'unavailable';
  });

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
    if (!this.token) {
      this.error.set('Token mancante o non valido.');
      this.loading.set(false);
      return;
    }
    this.loadAppointment();
  }

  onConfirm(): void {
    const slot = this.selectedSlot();
    if (!slot) return;

    this.error.set(null);
    this.actionLoading.set('accept');

    this.bookingService.acceptProposedTime(this.token, { selectedStart: slot.start, selectedEnd: slot.end }).subscribe({
      next: appointment => {
        this.appointment.set(appointment);
        this.outcome.set('accepted');
        this.actionLoading.set(null);
      },
      error: err => {
        this.error.set(getErrorMessage(err));
        this.actionLoading.set(null);
      },
    });
  }

  onReject(): void {
    this.error.set(null);
    this.actionLoading.set('reject');

    this.bookingService.rejectProposedTime(this.token).subscribe({
      next: appointment => {
        this.appointment.set(appointment);
        this.outcome.set('rejected');
        this.actionLoading.set(null);
      },
      error: err => {
        this.error.set(getErrorMessage(err));
        this.actionLoading.set(null);
      },
    });
  }

  formatFull(iso: string): string {
    return new Intl.DateTimeFormat('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: this.appointment()?.studioTimezone ?? 'Europe/Rome',
    }).format(new Date(iso));
  }

  formatTime(iso: string): string {
    return new Intl.DateTimeFormat('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: this.appointment()?.studioTimezone ?? 'Europe/Rome',
    }).format(new Date(iso));
  }

  formatSlotLabel(start: string, end: string): string {
    const dateStr = new Intl.DateTimeFormat('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: this.appointment()?.studioTimezone ?? 'Europe/Rome',
    }).format(new Date(start));
    const startTime = this.formatTime(start);
    const endTime = this.formatTime(end);
    return `${dateStr} ${startTime} – ${endTime}`;
  }

  private loadAppointment(): void {
    this.loading.set(true);
    this.error.set(null);

    this.bookingService.getAppointmentByToken(this.token).subscribe({
      next: appointment => {
        this.appointment.set(appointment);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(getErrorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
