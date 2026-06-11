import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PublicBookingService } from '../../core/services/public-booking.service';
import { getErrorMessage } from '../../shared/utils/errors';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import type { AppointmentResponse } from '../../core/models/domain.model';

@Component({
  selector: 'app-public-booking-confirm',
  standalone: true,
  imports: [RouterLink, CardComponent, ButtonComponent, AlertComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-6">
      <div class="mx-auto w-full max-w-2xl py-6">
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
        } @else if (accepted() && appointment()) {
          <app-card extraClass="text-center">
            <div class="py-4">
              <div class="mb-4 text-5xl">✅</div>
              <h2 class="mb-2 text-xl font-bold text-gray-900">Nuovo orario confermato</h2>
              <p class="mx-auto mb-4 max-w-md text-sm text-gray-500">
                Hai confermato la proposta per
                <strong>{{ appointment()!.serviceTypeName ?? 'appuntamento' }}</strong>
                con
                <strong>{{ appointment()!.professionalFullName }}</strong>.
              </p>
              @if (appointment()!.proposedStart && appointment()!.proposedEnd) {
                <div class="mx-auto inline-flex rounded-lg bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700">
                  📅 {{ formatFull(appointment()!.proposedStart!) }} - {{ formatTime(appointment()!.proposedEnd!) }}
                </div>
              }
              @if (appointment()!.studioSlug) {
                <div class="mt-6">
                  <a [routerLink]="['/prenota', appointment()!.studioSlug]">
                    <app-button variant="secondary">Vai alla pagina prenotazioni</app-button>
                  </a>
                </div>
              }
            </div>
          </app-card>
        } @else if (appointment()) {
          <app-card>
            <h1 class="text-xl font-bold text-gray-900">Conferma nuovo orario</h1>
            <p class="mt-1 text-sm text-gray-500">
              {{ appointment()!.professionalFullName }} ha proposto un nuovo orario per il tuo appuntamento.
            </p>

            <div class="mt-6 space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
              <div class="flex flex-col gap-1 sm:flex-row sm:justify-between">
                <span class="font-medium text-gray-600">Cliente</span>
                <span class="text-gray-900">{{ appointment()!.clientFullName }}</span>
              </div>
              <div class="flex flex-col gap-1 sm:flex-row sm:justify-between">
                <span class="font-medium text-gray-600">Servizio</span>
                <span class="text-gray-900">{{ appointment()!.serviceTypeName ?? 'Appuntamento' }}</span>
              </div>
              <div class="flex flex-col gap-1 sm:flex-row sm:justify-between">
                <span class="font-medium text-gray-600">Orario attuale</span>
                <span class="text-gray-900">{{ formatFull(appointment()!.startDatetime) }} - {{ formatTime(appointment()!.endDatetime) }}</span>
              </div>
              <div class="flex flex-col gap-1 sm:flex-row sm:justify-between">
                <span class="font-medium text-blue-700">Nuovo orario proposto</span>
                @if (appointment()!.proposedStart && appointment()!.proposedEnd) {
                  <span class="font-semibold text-blue-700">
                    {{ formatFull(appointment()!.proposedStart!) }} - {{ formatTime(appointment()!.proposedEnd!) }}
                  </span>
                } @else {
                  <span class="text-gray-500">Orario non disponibile</span>
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
                [isLoading]="actionLoading() === 'accept'"
                [disabled]="actionLoading() !== null"
                (click)="onAccept()"
              >
                Accetta nuovo orario
              </app-button>
              <app-button
                variant="danger"
                [isLoading]="actionLoading() === 'reject'"
                [disabled]="actionLoading() !== null"
                (click)="onReject()"
              >
                Rifiuta nuovo orario
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
  private readonly router = inject(Router);
  private readonly bookingService = inject(PublicBookingService);

  private token = '';

  readonly loading = signal(true);
  readonly actionLoading = signal<'accept' | 'reject' | null>(null);
  readonly error = signal<string | null>(null);
  readonly appointment = signal<AppointmentResponse | null>(null);
  readonly accepted = signal(false);

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
    if (!this.token) {
      this.error.set('Token mancante o non valido.');
      this.loading.set(false);
      return;
    }

    this.loadAppointment();
  }

  onAccept(): void {
    if (!this.appointment()) return;

    this.error.set(null);
    this.actionLoading.set('accept');

    this.bookingService.acceptProposedTime(this.token).subscribe({
      next: appointment => {
        this.appointment.set(appointment);
        this.accepted.set(true);
        this.actionLoading.set(null);
      },
      error: err => {
        this.error.set(getErrorMessage(err));
        this.actionLoading.set(null);
      },
    });
  }

  onReject(): void {
    const current = this.appointment();
    if (!current) return;

    this.error.set(null);
    this.actionLoading.set('reject');

    this.bookingService.rejectProposedTime(this.token).subscribe({
      next: appointment => {
        const slug = appointment.studioSlug || current.studioSlug;
        if (slug) {
          this.router.navigate(['/prenota', slug]);
          return;
        }
        this.error.set('Impossibile reindirizzare alla pagina di prenotazione dello studio.');
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
    }).format(new Date(iso));
  }

  formatTime(iso: string): string {
    return new Intl.DateTimeFormat('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
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
