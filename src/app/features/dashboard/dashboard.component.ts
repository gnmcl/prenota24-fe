import { Component, inject, signal, computed } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { catchError, map, of, switchMap } from 'rxjs';
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
      <div class="mx-auto max-w-6xl">
        <!-- Header row: greeting + quick actions -->
        <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 class="text-2xl font-bold text-[var(--text-primary)]">
              Benvenuto{{ authService.user()?.name ? ', ' + authService.user()!.name : '' }}! 👋
            </h2>
            <p class="mt-1 text-sm text-[var(--text-secondary)]">{{ todayFormatted }}</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <a routerLink="/appuntamenti/nuovo"><app-button>+ Appuntamento</app-button></a>
            <a routerLink="/clienti/nuovo"><app-button variant="secondary">+ Cliente</app-button></a>
            <a routerLink="/eventi/nuovo"><app-button variant="secondary">+ Evento</app-button></a>
          </div>
        </div>

        <!-- Minimal stat pills -->
        <div class="mb-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <div class="flex items-center gap-2">
            <span class="flex h-2 w-2 rounded-full bg-[var(--color-primary)]"></span>
            <span class="text-sm text-[var(--text-secondary)]">Oggi</span>
            <span class="text-sm font-semibold text-[var(--text-primary)]">{{ todayAppointments().length }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="flex h-2 w-2 rounded-full bg-amber-500"></span>
            <span class="text-sm text-[var(--text-secondary)]">Da confermare</span>
            <span class="text-sm font-semibold text-[var(--text-primary)]">{{ pendingCount() }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="flex h-2 w-2 rounded-full bg-green-500"></span>
            <span class="text-sm text-[var(--text-secondary)]">Clienti</span>
            <span class="text-sm font-semibold text-[var(--text-primary)]">{{ clientCount() }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="flex h-2 w-2 rounded-full bg-purple-500"></span>
            <span class="text-sm text-[var(--text-secondary)]">Eventi attivi</span>
            <span class="text-sm font-semibold text-[var(--text-primary)]">{{ publishedCount() }}</span>
          </div>
        </div>

        <!-- Main content: appointments + calendar/event overview -->
        <div class="grid items-stretch gap-6 lg:grid-cols-5">
          <div class="h-full lg:col-span-3 min-w-0">
            <app-card extraClass="h-full flex flex-col overflow-hidden">
              <div class="flex items-center justify-between mb-5">
                <div>
                  <h3 class="text-sm font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Appuntamenti</h3>
                  <p class="mt-1 text-xs text-[var(--text-secondary)]">{{ selectedDateLabel() }}</p>
                </div>
                <a routerLink="/appuntamenti" class="text-xs font-medium text-[var(--color-primary)] hover:opacity-80 transition-opacity">Vedi tutti →</a>
              </div>
              <div class="flex-1 min-h-0">
              @if (isLoading()) {
                <div class="flex justify-center py-10">
                  <div class="h-7 w-7 animate-spin rounded-full border-4 border-[var(--surface-card-border)] border-t-[var(--color-primary)]"></div>
                </div>
              } @else if (selectedDayAppointments().length === 0) {
                <div class="flex flex-col items-center justify-center py-10 text-center">
                  <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-hover)]">
                    <svg class="h-6 w-6 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/>
                    </svg>
                  </div>
                  <p class="text-sm font-medium text-[var(--text-secondary)]">Nessun appuntamento per questa data</p>
                  <p class="mt-1 text-xs text-[var(--text-tertiary)]">La giornata e libera</p>
                </div>
              } @else {
                <div class="space-y-2 overflow-y-auto overflow-x-hidden pr-1 max-h-[32rem]">
                  @for (apt of selectedDayAppointments(); track apt.id) {
                    <a [routerLink]="['/appuntamenti', apt.id]"
                       class="group flex flex-col rounded-xl border border-[var(--surface-card-border)] border-l-[3px] p-3 hover:bg-[var(--surface-hover)] transition-all duration-150 sm:flex-row sm:items-center sm:gap-3 sm:p-3.5"
                       [style.borderLeftColor]="apt.serviceTypeColor || '#6366f1'">
                      <!-- Mobile: time + badge in same row; Desktop: time block -->
                      <div class="flex items-center justify-between gap-2 sm:block sm:shrink-0">
                        <div class="flex items-center gap-1 sm:w-[62px] sm:flex-col sm:items-center sm:gap-0 sm:text-center">
                          <span class="text-sm font-semibold text-[var(--text-primary)]">{{ formatTime(apt.startDatetime) }}</span>
                          <span class="text-[11px] text-[var(--text-tertiary)] sm:hidden">→</span>
                          <span class="text-[11px] text-[var(--text-tertiary)]">{{ formatTime(apt.endDatetime) }}</span>
                        </div>
                        <span class="shrink-0 sm:hidden">
                          <app-badge [variant]="statusVariant(apt.status)">{{ statusLabel(apt.status) }}</app-badge>
                        </span>
                      </div>
                      <!-- Color separator (desktop only) -->
                      <div class="hidden sm:block w-0.5 self-stretch shrink-0 rounded-full"
                           [style.backgroundColor]="apt.serviceTypeColor || '#6366f1'"></div>
                      <!-- Name + service/professional -->
                      <div class="mt-1.5 min-w-0 flex-1 sm:mt-0">
                        <div class="flex items-start gap-2">
                          <span class="font-medium leading-snug text-[var(--text-primary)]">{{ apt.clientFullName }}</span>
                          <span class="hidden shrink-0 sm:inline">
                            <app-badge [variant]="statusVariant(apt.status)">{{ statusLabel(apt.status) }}</app-badge>
                          </span>
                        </div>
                        <div class="mt-0.5 text-xs leading-snug text-[var(--text-secondary)]">
                          @if (apt.serviceTypeName) {
                            {{ apt.serviceTypeName }} ·
                          }
                          {{ apt.professionalFullName }}
                        </div>
                      </div>
                      <!-- Arrow (desktop only) -->
                      <svg class="hidden sm:block h-4 w-4 shrink-0 text-[var(--text-tertiary)] transition-colors group-hover:text-[var(--color-primary)]"
                           fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                      </svg>
                    </a>
                  }
                </div>
              }
              </div>
            </app-card>
          </div>

          <div class="h-full lg:col-span-2 min-w-0">
            <app-card extraClass="h-full flex flex-col overflow-hidden">
              <div class="flex items-center justify-between mb-5">
                <h3 class="text-sm font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Calendario ed eventi</h3>
                <a routerLink="/eventi" class="text-xs font-medium text-[var(--color-primary)] hover:opacity-80 transition-opacity">Tutti →</a>
              </div>

              <div class="mb-4 flex items-center justify-between rounded-xl border border-[var(--surface-card-border)] bg-[var(--surface-hover)] px-3 py-2">
                <button
                  type="button"
                  (click)="goToPreviousMonth()"
                  class="rounded-md px-2 py-1 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-card)] hover:text-[var(--text-primary)]"
                  aria-label="Mese precedente"
                >
                  ←
                </button>
                <button
                  type="button"
                  (click)="goToToday()"
                  class="text-sm font-semibold text-[var(--text-primary)]"
                >
                  {{ monthLabel() }}
                </button>
                <button
                  type="button"
                  (click)="goToNextMonth()"
                  class="rounded-md px-2 py-1 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-card)] hover:text-[var(--text-primary)]"
                  aria-label="Mese successivo"
                >
                  →
                </button>
              </div>

              <div class="grid grid-cols-7 gap-1 mb-2">
                @for (weekday of weekdayLabels; track weekday) {
                  <div class="py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">{{ weekday }}</div>
                }
              </div>

              <div class="grid grid-cols-7 gap-1">
                @for (day of calendarDays(); track day.dateKey) {
                  <button
                    type="button"
                    (click)="selectDate(day.dateKey)"
                    [class]="dayButtonClass(day)"
                  >
                    <span>{{ day.dayNumber }}</span>
                    @if (day.appointmentCount > 0 || day.eventCount > 0) {
                      <span class="absolute bottom-1 flex items-center gap-1">
                        @if (day.appointmentCount > 0) {
                          <span class="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]"></span>
                        }
                        @if (day.eventCount > 0) {
                          <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                        }
                      </span>
                    }
                  </button>
                }
              </div>

              <div class="mt-5 flex-1 min-h-0 border-t border-[var(--surface-card-border)] pt-4">
                <h4 class="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                  Eventi del {{ selectedDateShortLabel() }}
                </h4>

                @if (isLoading()) {
                  <div class="flex justify-center py-8">
                    <div class="h-6 w-6 animate-spin rounded-full border-4 border-[var(--surface-card-border)] border-t-[var(--color-primary)]"></div>
                  </div>
                } @else if (selectedDayEvents().length === 0) {
                  <div class="flex flex-col items-center justify-center py-8 text-center">
                    <div class="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-hover)]">
                      <svg class="h-5 w-5 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                      </svg>
                    </div>
                    <p class="text-sm text-[var(--text-secondary)]">Nessun evento in programma</p>
                  </div>
                } @else {
                  <div class="space-y-2 overflow-y-auto max-h-52 pr-1">
                    @for (event of selectedDayEvents(); track event.id) {
                      <a
                        [routerLink]="['/eventi', event.id]"
                        class="group flex items-center justify-between rounded-xl border border-[var(--surface-card-border)] p-3 hover:bg-[var(--surface-hover)] transition-colors"
                      >
                        <div class="min-w-0">
                          <div class="truncate text-sm font-medium text-[var(--text-primary)]">{{ event.title }}</div>
                          <div class="mt-0.5 text-xs text-[var(--text-secondary)]">
                            👥 {{ event.currentParticipants }}{{ event.maxParticipants ? '/' + event.maxParticipants : '' }}
                          </div>
                        </div>
                        <svg class="ml-2 h-4 w-4 shrink-0 text-[var(--text-tertiary)] group-hover:text-[var(--color-primary)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                      </a>
                    }
                  </div>
                }
              </div>
            </app-card>
          </div>
        </div>
      </div>
    </app-page-shell>
  `,
})
export class DashboardComponent {
  readonly authService = inject(AuthService);
  private readonly eventService = inject(EventService);
  private readonly aptService = inject(AppointmentService);
  private readonly clientService = inject(ClientService);

  readonly selectedDate = signal(this.toDateKey(new Date()));
  readonly displayedMonth = signal(this.startOfMonth(new Date()));

  private readonly _events = toSignal(
    this.eventService.getMyEvents().pipe(catchError(() => of([] as EventSummaryResponse[])))
  );

  private readonly _appointments = toSignal(
    toObservable(this.displayedMonth).pipe(
      switchMap((month) => {
        const startDate = this.toDateKey(new Date(month.getFullYear(), month.getMonth(), 1));
        const endDate = this.toDateKey(new Date(month.getFullYear(), month.getMonth() + 1, 0));
        console.log('Loading appointments for month', month, 'with range', startDate, endDate);
        return this.aptService.list(0, 500, undefined, undefined, startDate, endDate).pipe(
          map((page) => page.content),
          
          catchError(() => of([] as AppointmentResponse[]))
        );
      })
    )
  );

  readonly pendingCount = toSignal(
    this.aptService.list(0, 1, 'REQUESTED').pipe(
      map((page) => page.page.totalElements),
      catchError(() => of(0))
    ),
    { initialValue: 0 }
  );

  readonly clientCount = toSignal(
    this.clientService.list(undefined, 0, 1).pipe(
      map((page) => page.page.totalElements),
      catchError(() => of(0))
    ),
    { initialValue: 0 }
  );

  readonly isLoading = computed(() => this._events() === undefined || this._appointments() === undefined);

  readonly publishedCount = computed(() =>
    (this._events() ?? []).filter((e) => e.status === 'PUBLISHED').length
  );

  readonly monthLabel = computed(() =>
    this.displayedMonth().toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
  );

  readonly appointmentCountByDate = computed(() => {
    const map = new Map<string, number>();
    for (const apt of this._appointments() ?? []) {
      const key = this.toDateKey(new Date(apt.startDatetime));
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  });

  readonly eventCountByDate = computed(() => {
    const map = new Map<string, number>();
    for (const event of this._events() ?? []) {
      map.set(event.eventDate, (map.get(event.eventDate) ?? 0) + 1);
    }
    return map;
  });

  readonly calendarDays = computed(() => {
    const currentMonth = this.displayedMonth();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const startWeekOffset = (firstDayOfMonth.getDay() + 6) % 7;
    const gridStart = new Date(firstDayOfMonth);
    gridStart.setDate(firstDayOfMonth.getDate() - startWeekOffset);

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      const dateKey = this.toDateKey(date);

      return {
        date,
        dateKey,
        dayNumber: date.getDate(),
        isCurrentMonth: date.getMonth() === currentMonth.getMonth(),
        isToday: dateKey === this.toDateKey(new Date()),
        isSelected: dateKey === this.selectedDate(),
        appointmentCount: this.appointmentCountByDate().get(dateKey) ?? 0,
        eventCount: this.eventCountByDate().get(dateKey) ?? 0,
      };
    });
  });

  readonly selectedDayAppointments = computed(() => {
    const selected = this.selectedDate();
    return (this._appointments() ?? [])
      .filter((apt) => this.toDateKey(new Date(apt.startDatetime)) === selected)
      .sort((a, b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime());
  });

  readonly selectedDayEvents = computed(() =>
    (this._events() ?? []).filter((event) => event.eventDate === this.selectedDate())
  );

  readonly selectedDateLabel = computed(() => {
    const selected = new Date(`${this.selectedDate()}T00:00:00`);
    return selected.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  });

  readonly selectedDateShortLabel = computed(() => {
    const selected = new Date(`${this.selectedDate()}T00:00:00`);
    return selected.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
    });
  });

  readonly todayAppointments = computed(() => {
    const today = this.toDateKey(new Date());
    return (this._appointments() ?? []).filter(
      (apt) => this.toDateKey(new Date(apt.startDatetime)) === today
    );
  });

  readonly weekdayLabels = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  readonly todayFormatted = new Date().toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  statusLabel(status: AppointmentStatus): string {
    const map: Record<string, string> = { REQUESTED: 'Da confermare', CONFIRMED: 'Confermato', PROPOSED_NEW_TIME: 'Proposta', CANCELLED: 'Cancellato', COMPLETED: 'Completato', NO_SHOW: 'Non presentato' };
    return map[status] ?? status;
  }

  statusVariant(status: AppointmentStatus): 'amber' | 'green' | 'blue' | 'red' | 'gray' | 'purple' {
    const map: Record<string, 'amber' | 'green' | 'blue' | 'red' | 'gray' | 'purple'> = { REQUESTED: 'amber', CONFIRMED: 'green', PROPOSED_NEW_TIME: 'blue', CANCELLED: 'red', COMPLETED: 'gray', NO_SHOW: 'purple' };
    return map[status] ?? 'gray';
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  }

  formatEventDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  }

  selectDate(dateKey: string): void {
    this.selectedDate.set(dateKey);
    const selected = new Date(`${dateKey}T00:00:00`);
    const newMonth = this.startOfMonth(selected);
    if (this.toDateKey(newMonth) !== this.toDateKey(this.displayedMonth())) {
      this.displayedMonth.set(newMonth);
    }
  }

  goToPreviousMonth(): void {
    const month = this.displayedMonth();
    this.displayedMonth.set(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  }

  goToNextMonth(): void {
    const month = this.displayedMonth();
    this.displayedMonth.set(new Date(month.getFullYear(), month.getMonth() + 1, 1));
  }

  goToToday(): void {
    const now = new Date();
    this.selectedDate.set(this.toDateKey(now));
    this.displayedMonth.set(this.startOfMonth(now));
  }

  dayButtonClass(day: {
    isCurrentMonth: boolean;
    isSelected: boolean;
    isToday: boolean;
  }): string {
    if (day.isSelected) {
      return 'relative flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold bg-[var(--color-primary)] text-[var(--text-inverted)] shadow-sm';
    }

    const base = 'relative flex h-11 w-full items-center justify-center rounded-lg text-sm font-medium transition-colors hover:bg-[var(--surface-hover)]';
    const monthStyle = day.isCurrentMonth
      ? 'text-[var(--text-primary)]'
      : 'text-[var(--text-tertiary)]';
    const todayStyle = day.isToday ? ' ring-1 ring-[var(--surface-card-border)]' : '';

    return `${base} ${monthStyle}${todayStyle}`;
  }

  private startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
