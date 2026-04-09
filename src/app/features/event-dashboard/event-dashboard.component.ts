import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../core/services/event.service';
import { getErrorMessage } from '../../shared/utils/errors';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import type { EventResponse, ReservationResponse } from '../../core/models/domain.model';

@Component({
  selector: 'app-event-dashboard',
  standalone: true,
  imports: [PageShellComponent, CardComponent, ButtonComponent, AlertComponent, ConfirmDialogComponent],
  template: `
    <app-page-shell>

      <!-- Loading spinner — shown only while loading -->
      @if (eventLoading()) {
        <div class="flex justify-center py-12">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
        </div>
      }

      <!-- Not found — shown after loading if no event -->
      @if (!eventLoading() && !event()) {
        <app-card extraClass="text-center">
          <p class="text-gray-500">Evento non trovato.</p>
        </app-card>
      }

      <!-- Main content — shown after loading when event exists -->
      @if (!eventLoading() && event()) {
        <div class="mx-auto max-w-3xl">
          <!-- Header -->
          <div class="mb-6 flex items-start justify-between">
            <div>
              <button (click)="router.navigate(['/eventi'])" class="mb-2 text-sm text-indigo-600 hover:text-indigo-500 font-medium">← Torna ai tuoi eventi</button>
              <h2 class="text-2xl font-bold text-gray-900">{{ event()!.title }}</h2>
              <div class="mt-1 flex items-center gap-3">
                <span [class]="'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ' + getBadgeClass(event()!.status)">
                  {{ getBadgeLabel(event()!.status) }}
                </span>
                <span class="text-sm text-gray-500">
                  📅 {{ formatDate(event()!.eventDate) }} • 🕐 {{ formatTime(event()!.startTime) }} – {{ formatTime(event()!.endTime) }}
                </span>
              </div>
            </div>
          </div>

          @if (actionError()) {
            <div class="mb-4">
              <app-alert variant="error" [message]="actionError()!" (dismiss)="actionError.set(null)" />
            </div>
          }

          <!-- Stats -->
          <div class="grid grid-cols-3 gap-4 mb-6">
            <app-card extraClass="text-center !p-4">
              <div class="text-2xl font-bold text-indigo-600">{{ confirmedCount() }}</div>
              <div class="text-xs text-gray-500 mt-1">Prenotazioni confermate</div>
            </app-card>
            <app-card extraClass="text-center !p-4">
              <div class="text-2xl font-bold text-gray-900">{{ event()!.maxParticipants ?? '∞' }}</div>
              <div class="text-xs text-gray-500 mt-1">Posti totali</div>
            </app-card>
            <app-card extraClass="text-center !p-4">
              <div class="text-2xl font-bold text-green-600">
                {{ event()!.maxParticipants ? event()!.maxParticipants! - confirmedCount() : '∞' }}
              </div>
              <div class="text-xs text-gray-500 mt-1">Posti disponibili</div>
            </app-card>
          </div>

          <!-- Actions -->
          <app-card extraClass="mb-6">
            <h3 class="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Azioni</h3>
            <div class="flex flex-wrap gap-3">
              @if (event()!.status === 'DRAFT') {
                <app-button (click)="updateStatus('PUBLISHED')" [isLoading]="statusLoading()">🚀 Pubblica evento</app-button>
              }
              @if (event()!.status === 'PUBLISHED') {
                <app-button variant="secondary" (click)="updateStatus('COMPLETED')" [isLoading]="statusLoading()">✅ Completa</app-button>
                <app-button variant="danger" (click)="updateStatus('CANCELLED')" [isLoading]="statusLoading()">❌ Cancella</app-button>
              }
              <app-button variant="secondary" (click)="copyLink()">
                {{ linkCopied() ? '✅ Link copiato!' : '📋 Copia link pubblico' }}
              </app-button>
              <div class="flex-1"></div>
              <app-button variant="danger" (click)="showDeleteConfirm.set(true)">🗑️ Elimina evento</app-button>
            </div>
            @if (event()!.description) {
              <div class="mt-4 pt-4 border-t border-gray-100">
                <p class="text-sm text-gray-600">{{ event()!.description }}</p>
              </div>
            }
            @if (event()!.location) {
              <p class="mt-2 text-sm text-gray-500">📍 {{ event()!.location }}</p>
            }
          </app-card>

          <!-- Reservations table -->
          <app-card>
            <h3 class="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Prenotazioni ({{ reservations().length }})
            </h3>

            @if (reservationsLoading()) {
              <div class="flex justify-center py-6">
                <div class="h-6 w-6 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
              </div>
            }

            @if (!reservationsLoading() && reservations().length === 0) {
              <p class="text-sm text-gray-500 py-4">Nessuna prenotazione per questo evento.</p>
            }

            @if (!reservationsLoading() && reservations().length > 0) {
              <div class="overflow-x-auto">
                <table class="min-w-full text-sm">
                  <thead>
                    <tr class="border-b border-gray-200">
                      <th class="py-2 pr-4 text-left font-medium text-gray-500">Nome</th>
                      <th class="py-2 pr-4 text-left font-medium text-gray-500">Email</th>
                      <th class="py-2 pr-4 text-left font-medium text-gray-500">Telefono</th>
                      <th class="py-2 pr-4 text-left font-medium text-gray-500">Stato</th>
                      <th class="py-2 pr-4 text-left font-medium text-gray-500">Data</th>
                      <th class="py-2 text-left font-medium text-gray-500"></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (r of reservations(); track r.id) {
                      <tr class="border-b border-gray-100 last:border-0">
                        <td class="py-3 pr-4 font-medium text-gray-900">{{ r.guestName }}</td>
                        <td class="py-3 pr-4 text-gray-600">{{ r.guestEmail }}</td>
                        <td class="py-3 pr-4 text-gray-600">{{ r.guestPhone ?? '–' }}</td>
                        <td class="py-3 pr-4">
                          <span [class]="'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ' + getResBadgeClass(r.status)">
                            {{ getResBadgeLabel(r.status) }}
                          </span>
                        </td>
                        <td class="py-3 pr-4 text-gray-500">{{ formatDateTime(r.createdAt) }}</td>
                        <td class="py-3">
                          @if (r.status === 'CONFIRMED') {
                            <button (click)="cancelTarget.set(r)" class="text-xs text-red-600 hover:text-red-500 font-medium">
                              Cancella
                            </button>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </app-card>
        </div>

        <!-- Confirm cancel reservation dialog -->
        <app-confirm-dialog
          [open]="!!cancelTarget()"
          title="Cancellare la prenotazione?"
          [message]="cancelTarget() ? 'Sei sicuro di voler cancellare la prenotazione di ' + cancelTarget()!.guestName + '?' : ''"
          confirmLabel="Sì, cancella"
          [isLoading]="cancelLoading()"
          (onConfirm)="confirmCancelReservation()"
          (onCancel)="cancelTarget.set(null)"
        />

        <!-- Confirm delete event dialog -->
        <app-confirm-dialog
          [open]="showDeleteConfirm()"
          title="Eliminare l'evento?"
          [message]="'Vuoi eliminare definitivamente questo evento? Tutte le prenotazioni verranno cancellate.'"
          confirmLabel="Sì, elimina"
          [isLoading]="deleteLoading()"
          (onConfirm)="confirmDelete()"
          (onCancel)="showDeleteConfirm.set(false)"
        />
      }

    </app-page-shell>
  `,
})
export class EventDashboardComponent implements OnInit {
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly eventService = inject(EventService);

  readonly event = signal<EventResponse | null>(null);
  readonly reservations = signal<ReservationResponse[]>([]);
  readonly eventLoading = signal(true);
  readonly reservationsLoading = signal(true);
  readonly statusLoading = signal(false);
  readonly deleteLoading = signal(false);
  readonly cancelLoading = signal(false);
  readonly actionError = signal<string | null>(null);
  readonly linkCopied = signal(false);
  readonly cancelTarget = signal<ReservationResponse | null>(null);
  readonly showDeleteConfirm = signal(false);

  readonly confirmedCount = computed(() =>
    this.reservations().filter(r => r.status === 'CONFIRMED').length
  );

  private eventId = '';

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('id') ?? '';
    console.log('[EventDashboard] Loading event id:', this.eventId);
    this.loadEvent();
    this.loadReservations();
  }

  private loadEvent(): void {
    this.eventService.getEventById(this.eventId).subscribe({
      next: (ev) => {
        console.log('[EventDashboard] Event loaded:', ev);
        this.event.set(ev);
        this.eventLoading.set(false);
      },
      error: (err) => {
        console.error('[EventDashboard] Event error:', err);
        this.eventLoading.set(false);
      },
    });
  }

  private loadReservations(): void {
    this.eventService.getEventReservations(this.eventId).subscribe({
      next: (res) => {
        console.log('[EventDashboard] Reservations loaded:', res);
        this.reservations.set(res);
        this.reservationsLoading.set(false);
      },
      error: (err) => {
        console.error('[EventDashboard] Reservations error:', err);
        this.reservationsLoading.set(false);
      },
    });
  }

  updateStatus(status: string): void {
    this.statusLoading.set(true);
    this.eventService.updateEventStatus(this.eventId, status).subscribe({
      next: (ev) => { this.event.set(ev); this.statusLoading.set(false); },
      error: (err) => { this.actionError.set(getErrorMessage(err)); this.statusLoading.set(false); },
    });
  }

  copyLink(): void {
    const ev = this.event();
    if (!ev) return;
    navigator.clipboard.writeText(`${window.location.origin}/e/${ev.slug}`);
    this.linkCopied.set(true);
    setTimeout(() => this.linkCopied.set(false), 2000);
  }

  confirmCancelReservation(): void {
    const target = this.cancelTarget();
    if (!target) return;
    this.cancelLoading.set(true);
    this.eventService.cancelReservation(target.id).subscribe({
      next: () => {
        this.cancelTarget.set(null);
        this.cancelLoading.set(false);
        this.loadReservations();
        this.loadEvent();
      },
      error: (err) => {
        this.cancelTarget.set(null);
        this.cancelLoading.set(false);
        this.actionError.set(getErrorMessage(err));
      },
    });
  }

  confirmDelete(): void {
    this.deleteLoading.set(true);
    this.eventService.deleteEvent(this.eventId).subscribe({
      next: () => this.router.navigate(['/eventi'], { replaceUrl: true }),
      error: (err) => {
        this.showDeleteConfirm.set(false);
        this.deleteLoading.set(false);
        this.actionError.set(getErrorMessage(err));
      },
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('it-IT', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  }
  formatTime(t: string): string { return t?.slice(0, 5) ?? ''; }
  formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString('it-IT', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  }

  getBadgeClass(s: string): string {
    const m: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-700',
      PUBLISHED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700',
      COMPLETED: 'bg-blue-100 text-blue-700',
    };
    return m[s] ?? m['DRAFT'];
  }
  getBadgeLabel(s: string): string {
    const m: Record<string, string> = {
      DRAFT: 'Bozza', PUBLISHED: 'Pubblicato', CANCELLED: 'Cancellato', COMPLETED: 'Completato',
    };
    return m[s] ?? 'Bozza';
  }
  getResBadgeClass(s: string): string {
    return s === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
  }
  getResBadgeLabel(s: string): string {
    return s === 'CONFIRMED' ? 'Confermata' : 'Cancellata';
  }
}
