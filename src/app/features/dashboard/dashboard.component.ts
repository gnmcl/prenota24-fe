import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { EventService } from '../../core/services/event.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { ClientService } from '../../core/services/client.service';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import type { EventSummaryResponse, AppointmentResponse, AppointmentStatus } from '../../core/models/domain.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, PageShellComponent, CardComponent, ButtonComponent, BadgeComponent],
  template: `
    <app-page-shell>
      <div class="mx-auto max-w-5xl">
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-gray-900">
            Benvenuto{{ authService.user()?.name ? ', ' + authService.user()!.name : '' }}! 👋
          </h2>
          <p class="text-gray-500">Ecco il riepilogo del tuo studio</p>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <app-card extraClass="text-center !p-5">
            <div class="text-3xl font-bold text-indigo-600">{{ todayAppointments().length }}</div>
            <div class="text-xs text-gray-500 mt-1">Appuntamenti oggi</div>
          </app-card>
          <app-card extraClass="text-center !p-5">
            <div class="text-3xl font-bold text-amber-600">{{ pendingCount() }}</div>
            <div class="text-xs text-gray-500 mt-1">Da confermare</div>
          </app-card>
          <app-card extraClass="text-center !p-5">
            <div class="text-3xl font-bold text-green-600">{{ clientCount() }}</div>
            <div class="text-xs text-gray-500 mt-1">Clienti</div>
          </app-card>
          <app-card extraClass="text-center !p-5">
            <div class="text-3xl font-bold text-purple-600">{{ publishedCount() }}</div>
            <div class="text-xs text-gray-500 mt-1">Eventi attivi</div>
          </app-card>
        </div>

        <!-- Quick Actions -->
        <app-card extraClass="mb-8">
          <h3 class="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Azioni rapide</h3>
          <div class="flex flex-wrap gap-3">
            <a routerLink="/appuntamenti/nuovo"><app-button>+ Nuovo appuntamento</app-button></a>
            <a routerLink="/clienti/nuovo"><app-button variant="secondary">+ Nuovo cliente</app-button></a>
            <a routerLink="/eventi/nuovo"><app-button variant="secondary">+ Nuovo evento</app-button></a>
          </div>
        </app-card>

        <div class="grid gap-6 lg:grid-cols-2">
          <!-- Today's appointments -->
          <app-card>
            <h3 class="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Appuntamenti di oggi</h3>
            @if (isLoading()) {
              <div class="flex justify-center py-4">
                <div class="h-6 w-6 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
              </div>
            } @else if (todayAppointments().length === 0) {
              <p class="py-4 text-center text-sm text-gray-400">Nessun appuntamento oggi</p>
            } @else {
              <div class="space-y-2">
                @for (apt of todayAppointments().slice(0, 5); track apt.id) {
                  <a [routerLink]="['/appuntamenti', apt.id]" class="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors">
                    <div class="min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="font-medium text-gray-900 truncate">{{ apt.clientFullName }}</span>
                        <app-badge [variant]="statusVariant(apt.status)">{{ statusLabel(apt.status) }}</app-badge>
                      </div>
                      <span class="text-sm text-gray-500">{{ timeRange(apt.startDatetime, apt.endDatetime) }} · {{ apt.professionalFullName }}</span>
                    </div>
                    <svg class="h-4 w-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </a>
                }
              </div>
              @if (todayAppointments().length > 5) {
                <a routerLink="/appuntamenti" class="mt-3 block text-center text-sm text-indigo-600 hover:text-indigo-500 font-medium">Vedi tutti →</a>
              }
            }
          </app-card>

          <!-- Recent Events -->
          <app-card>
            <h3 class="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Eventi recenti</h3>
            @if (isLoading()) {
              <div class="flex justify-center py-4">
                <div class="h-6 w-6 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
              </div>
            } @else if (recentEvents().length === 0) {
              <p class="py-4 text-center text-sm text-gray-400">Nessun evento ancora</p>
            } @else {
              <div class="space-y-2">
                @for (event of recentEvents(); track event.id) {
                  <a [routerLink]="['/eventi', event.id]" class="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors">
                    <div>
                      <span class="font-medium text-gray-900">{{ event.title }}</span>
                      <span class="ml-2 text-sm text-gray-400">👥 {{ event.currentParticipants }}{{ event.maxParticipants ? '/' + event.maxParticipants : '' }}</span>
                    </div>
                    <svg class="h-4 w-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </a>
                }
              </div>
              @if (totalEvents() > 3) {
                <a routerLink="/eventi" class="mt-3 block text-center text-sm text-indigo-600 hover:text-indigo-500 font-medium">Vedi tutti gli eventi →</a>
              }
            }
          </app-card>
        </div>
      </div>
    </app-page-shell>
  `,
})
export class DashboardComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly eventService = inject(EventService);
  private readonly aptService = inject(AppointmentService);
  private readonly clientService = inject(ClientService);

  private readonly _events = signal<EventSummaryResponse[]>([]);
  private readonly _todayApts = signal<AppointmentResponse[]>([]);
  private readonly _pendingCount = signal(0);
  private readonly _clientCount = signal(0);
  readonly isLoading = signal(true);

  readonly recentEvents = computed(() => this._events().slice(0, 3));
  readonly totalEvents = computed(() => this._events().length);
  readonly publishedCount = computed(() => this._events().filter(e => e.status === 'PUBLISHED').length);
  readonly todayAppointments = computed(() => this._todayApts());
  readonly pendingCount = computed(() => this._pendingCount());
  readonly clientCount = computed(() => this._clientCount());

  ngOnInit(): void {
    this.eventService.getMyEvents().subscribe({
      next: (data) => {
        this._events.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });

    // Load today's appointments
    this.aptService.list(0, 50, 'CONFIRMED').subscribe({
      next: (page) => {
        const today = new Date().toDateString();
        this._todayApts.set(page.content.filter((a) => new Date(a.startDatetime).toDateString() === today));
      },
    });

    // Pending count
    this.aptService.list(0, 1, 'REQUESTED').subscribe({
      next: (page) => this._pendingCount.set(page.totalElements),
    });

    // Client count
    this.clientService.list(undefined, 0, 1).subscribe({
      next: (page) => this._clientCount.set(page.totalElements),
    });
  }

  statusLabel(status: AppointmentStatus): string {
    const map: Record<string, string> = { REQUESTED: 'Da confermare', CONFIRMED: 'Confermato', PROPOSED_NEW_TIME: 'Proposta', CANCELLED: 'Cancellato', COMPLETED: 'Completato', NO_SHOW: 'Non presentato' };
    return map[status] ?? status;
  }

  statusVariant(status: AppointmentStatus): 'amber' | 'green' | 'blue' | 'red' | 'gray' | 'purple' {
    const map: Record<string, 'amber' | 'green' | 'blue' | 'red' | 'gray' | 'purple'> = { REQUESTED: 'amber', CONFIRMED: 'green', PROPOSED_NEW_TIME: 'blue', CANCELLED: 'red', COMPLETED: 'gray', NO_SHOW: 'purple' };
    return map[status] ?? 'gray';
  }

  timeRange(start: string, end: string): string {
    const fmt = (d: Date) => d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    return `${fmt(new Date(start))} – ${fmt(new Date(end))}`;
  }
}
