import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import type {
  AppointmentCapacityLevel,
  AppointmentResponse,
  AppointmentStatus,
  DayAppointmentCountResponse,
  EventSummaryResponse,
} from '../../core/models/domain.model';
import { AppointmentService } from '../../core/services/appointment.service';
import { AuthService } from '../../core/services/auth.service';
import { ClientService } from '../../core/services/client.service';
import { EventService } from '../../core/services/event.service';
import { PendingAppointmentsService } from '../../core/services/pending-appointments.service';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { RegisterSurfaceComponent } from '../../shared/components/register-surface/register-surface.component';
import { AppointmentContextPanelComponent } from './appointment-context-panel.component';

interface WeekDay {
  dateKey: string;
  dayName: string;
  dayNumber: number;
  monthName: string;
  isToday: boolean;
  isSelected: boolean;
  appointmentCount: number;
}

interface CalendarDay {
  date: Date;
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  appointmentCount: number;
  eventCount: number;
  capacityLevel: AppointmentCapacityLevel;
}

interface PendingSnapshot {
  items: AppointmentResponse[];
  total: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    PageShellComponent,
    ButtonComponent,
    BadgeComponent,
    AlertComponent,
    EmptyStateComponent,
    AppointmentContextPanelComponent,
    RegisterSurfaceComponent,
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly eventService = inject(EventService);
  private readonly aptService = inject(AppointmentService);
  private readonly clientService = inject(ClientService);
  private readonly pendingService = inject(PendingAppointmentsService);

  readonly selectedDate = signal(this.toDateKey(new Date()));
  readonly displayedMonth = signal(this.toMonthKey(new Date()));
  readonly selectedAppointmentId = signal<string | null>(null);
  readonly appointments = signal<AppointmentResponse[]>([]);
  readonly pendingAppointments = signal<AppointmentResponse[]>([]);
  readonly events = signal<EventSummaryResponse[]>([]);
  readonly calendarCounts = signal<DayAppointmentCountResponse[]>([]);
  readonly pendingCount = signal(0);
  readonly clientCount = signal(0);
  readonly isLoading = signal(true);
  readonly isMonthLoading = signal(false);
  readonly isConfirming = signal(false);
  readonly dataError = signal<string | null>(null);
  readonly actionMessage = signal<string | null>(null);

  readonly appointmentCountByDate = computed(() => {
    const counts = new Map<string, number>();
    for (const appointment of this.appointments()) {
      const key = this.toDateKey(new Date(appointment.startDatetime));
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  });

  readonly eventCountByDate = computed(() => {
    const counts = new Map<string, number>();
    for (const event of this.events()) {
      counts.set(event.eventDate, (counts.get(event.eventDate) ?? 0) + 1);
    }
    return counts;
  });

  readonly capacityByDate = computed(() => {
    const levels = new Map<string, AppointmentCapacityLevel>();
    for (const entry of this.calendarCounts()) levels.set(entry.date, entry.capacityLevel);
    return levels;
  });

  readonly selectedDayAppointments = computed(() =>
    this.appointments()
      .filter((appointment) => this.toDateKey(new Date(appointment.startDatetime)) === this.selectedDate())
      .sort((first, second) => new Date(first.startDatetime).getTime() - new Date(second.startDatetime).getTime()),
  );

  readonly selectedDayEvents = computed(() =>
    this.events().filter((event) => event.eventDate === this.selectedDate()),
  );

  readonly selectedAppointment = computed(() => {
    const id = this.selectedAppointmentId();
    return id ? this.appointments().find((appointment) => appointment.id === id) ?? null : null;
  });

  readonly publishedCount = computed(() => this.events().filter((event) => event.status === 'PUBLISHED').length);

  readonly weekDays = computed<WeekDay[]>(() => {
    const selected = new Date(`${this.selectedDate()}T00:00:00`);
    const mondayOffset = (selected.getDay() + 6) % 7;
    const monday = new Date(selected);
    monday.setDate(selected.getDate() - mondayOffset);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const dateKey = this.toDateKey(date);
      return {
        dateKey,
        dayName: date.toLocaleDateString('it-IT', { weekday: 'short' }).replace('.', ''),
        dayNumber: date.getDate(),
        monthName: date.toLocaleDateString('it-IT', { month: 'short' }).replace('.', ''),
        isToday: dateKey === this.toDateKey(new Date()),
        isSelected: dateKey === this.selectedDate(),
        appointmentCount: this.appointmentCountByDate().get(dateKey) ?? 0,
      };
    });
  });

  readonly calendarDays = computed<CalendarDay[]>(() => {
    const month = this.monthFromKey(this.displayedMonth());
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(first.getDate() - offset);

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const dateKey = this.toDateKey(date);
      return {
        date,
        dateKey,
        dayNumber: date.getDate(),
        isCurrentMonth: date.getMonth() === month.getMonth(),
        isToday: dateKey === this.toDateKey(new Date()),
        isSelected: dateKey === this.selectedDate(),
        appointmentCount: this.appointmentCountByDate().get(dateKey) ?? 0,
        eventCount: this.eventCountByDate().get(dateKey) ?? 0,
        capacityLevel: this.capacityByDate().get(dateKey) ?? 'AVAILABLE',
      };
    });
  });

  readonly selectedDateLabel = computed(() =>
    new Date(`${this.selectedDate()}T00:00:00`).toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  );

  readonly selectedDateShortLabel = computed(() =>
    new Date(`${this.selectedDate()}T00:00:00`).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' }),
  );

  readonly monthLabel = computed(() =>
    this.monthFromKey(this.displayedMonth()).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }),
  );

  readonly todayFormatted = new Date().toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  readonly currentTimeLabel = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  readonly weekdayLabels = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];

  ngOnInit(): void {
    this.loadInitialData();
  }

  selectDate(dateKey: string): void {
    this.selectedDate.set(dateKey);
    this.selectedAppointmentId.set(null);
    const monthKey = this.toMonthKey(new Date(`${dateKey}T00:00:00`));
    if (monthKey !== this.displayedMonth()) {
      this.displayedMonth.set(monthKey);
      this.loadMonthData();
      return;
    }
    this.ensureSelectedAppointment();
  }

  selectAppointment(appointment: AppointmentResponse): void {
    this.selectedAppointmentId.set(
      this.selectedAppointmentId() === appointment.id ? null : appointment.id,
    );
    this.actionMessage.set(null);
  }

  confirmAppointment(appointment: AppointmentResponse): void {
    if (appointment.status !== 'REQUESTED' || this.isConfirming()) return;
    this.isConfirming.set(true);
    this.actionMessage.set(null);
    this.aptService.confirm(appointment.id).subscribe({
      next: (updated) => {
        this.appointments.update((items) => items.map((item) => item.id === updated.id ? updated : item));
        this.pendingAppointments.update((items) => items.filter((item) => item.id !== updated.id));
        this.pendingCount.update((count) => Math.max(0, count - 1));
        this.pendingService.forceRefresh();
        this.actionMessage.set(`Prenotazione di ${updated.clientFullName} confermata.`);
        this.isConfirming.set(false);
      },
      error: () => {
        this.dataError.set('Non è stato possibile confermare la prenotazione. Riprova dalla scheda appuntamento.');
        this.isConfirming.set(false);
      },
    });
  }

  goToPreviousMonth(): void {
    const month = this.monthFromKey(this.displayedMonth());
    this.displayedMonth.set(this.toMonthKey(new Date(month.getFullYear(), month.getMonth() - 1, 1)));
    this.loadMonthData();
  }

  goToNextMonth(): void {
    const month = this.monthFromKey(this.displayedMonth());
    this.displayedMonth.set(this.toMonthKey(new Date(month.getFullYear(), month.getMonth() + 1, 1)));
    this.loadMonthData();
  }

  goToToday(): void {
    const today = new Date();
    const monthKey = this.toMonthKey(today);
    this.selectedDate.set(this.toDateKey(today));
    this.selectedAppointmentId.set(null);
    if (monthKey !== this.displayedMonth()) {
      this.displayedMonth.set(monthKey);
      this.loadMonthData();
    } else {
      this.ensureSelectedAppointment();
    }
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  }

  durationMinutes(appointment: AppointmentResponse): number {
    return Math.max(0, Math.round((new Date(appointment.endDatetime).getTime() - new Date(appointment.startDatetime).getTime()) / 60_000));
  }

  statusLabel(status: AppointmentStatus): string {
    const map: Record<AppointmentStatus, string> = {
      REQUESTED: 'Da confermare',
      CONFIRMED: 'Confermato',
      PROPOSED_NEW_TIME: 'Proposta',
      CANCELLED: 'Cancellato',
      COMPLETED: 'Completato',
      NO_SHOW: 'Non presentato',
    };
    return map[status];
  }

  statusVariant(status: AppointmentStatus): 'amber' | 'green' | 'blue' | 'red' | 'gray' | 'purple' {
    const map: Record<AppointmentStatus, 'amber' | 'green' | 'blue' | 'red' | 'gray' | 'purple'> = {
      REQUESTED: 'amber',
      CONFIRMED: 'green',
      PROPOSED_NEW_TIME: 'blue',
      CANCELLED: 'red',
      COMPLETED: 'gray',
      NO_SHOW: 'purple',
    };
    return map[status];
  }

  weekDayClass(day: WeekDay): string {
    const selected = day.isSelected
      ? '!border-[var(--color-primary)] !bg-[var(--color-primary)] !text-white'
      : '!border-transparent !bg-transparent hover:!bg-[var(--surface-hover)]';
    return `h-auto min-h-[72px] w-full !flex-col !gap-0.5 !px-2 !py-2 ${selected}`;
  }

  calendarDayClass(day: CalendarDay): string {
    const selected = day.isSelected ? '!bg-[var(--color-primary)] !text-white' : '!bg-transparent';
    const month = day.isCurrentMonth ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)] opacity-45';
    const today = day.isToday && !day.isSelected ? '!border-[var(--color-primary)]' : '!border-transparent';
    return `relative !h-9 !w-full !min-h-0 !rounded-sm !p-0 text-xs ${selected} ${month} ${today}`;
  }

  dayAriaLabel(day: CalendarDay): string {
    const label = day.date.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
    return `${label}: ${day.appointmentCount} appuntamenti, ${day.eventCount} eventi${day.isSelected ? '. Selezionato' : ''}`;
  }

  showCurrentTimeBefore(appointment: AppointmentResponse, index: number): boolean {
    if (this.selectedDate() !== this.toDateKey(new Date())) return false;
    const now = Date.now();
    const startsAfterNow = new Date(appointment.startDatetime).getTime() >= now;
    if (!startsAfterNow) return false;
    return index === 0 || new Date(this.selectedDayAppointments()[index - 1].startDatetime).getTime() < now;
  }

  showCurrentTimeAfterLast(): boolean {
    if (this.selectedDate() !== this.toDateKey(new Date())) return false;
    const items = this.selectedDayAppointments();
    return items.length > 0 && new Date(items[items.length - 1].startDatetime).getTime() < Date.now();
  }

  private loadInitialData(): void {
    const range = this.monthRange();
    const fail = (): void => this.dataError.set('Alcuni dati non sono disponibili. Puoi continuare a lavorare e riprovare più tardi.');

    forkJoin({
      events: this.eventService.getMyEvents().pipe(catchError(() => { fail(); return of([] as EventSummaryResponse[]); })),
      appointments: this.aptService.list(0, 500, undefined, undefined, range.start, range.end, 'startDatetime,asc').pipe(
        map((page) => page.content),
        catchError(() => { fail(); return of([] as AppointmentResponse[]); }),
      ),
      counts: this.aptService.getCalendarCounts(range.start, range.end).pipe(catchError(() => { fail(); return of([] as DayAppointmentCountResponse[]); })),
      pending: this.aptService.list(0, 4, 'REQUESTED', undefined, undefined, undefined, 'startDatetime,asc').pipe(
        map((page): PendingSnapshot => ({ items: page.content, total: page.page.totalElements })),
        catchError(() => { fail(); return of({ items: [], total: 0 } as PendingSnapshot); }),
      ),
      clients: this.clientService.list(undefined, 0, 1).pipe(
        map((page) => page.page.totalElements),
        catchError(() => { fail(); return of(0); }),
      ),
    }).subscribe(({ events, appointments, counts, pending, clients }) => {
      this.events.set(events);
      this.appointments.set(appointments);
      this.calendarCounts.set(counts);
      this.pendingAppointments.set(pending.items);
      this.pendingCount.set(pending.total);
      this.clientCount.set(clients);
      this.isLoading.set(false);
      this.ensureSelectedAppointment();
    });
  }

  private loadMonthData(): void {
    const range = this.monthRange();
    this.isMonthLoading.set(true);
    forkJoin({
      appointments: this.aptService.list(0, 500, undefined, undefined, range.start, range.end, 'startDatetime,asc').pipe(map((page) => page.content)),
      counts: this.aptService.getCalendarCounts(range.start, range.end),
    }).subscribe({
      next: ({ appointments, counts }) => {
        this.appointments.set(appointments);
        this.calendarCounts.set(counts);
        this.isMonthLoading.set(false);
        this.ensureSelectedAppointment();
      },
      error: () => {
        this.dataError.set('Non è stato possibile caricare il mese selezionato. Riprova più tardi.');
        this.isMonthLoading.set(false);
      },
    });
  }

  private ensureSelectedAppointment(): void {
    const current = this.selectedAppointmentId();
    if (current && this.selectedDayAppointments().some((appointment) => appointment.id === current)) return;
    this.selectedAppointmentId.set(this.selectedDayAppointments()[0]?.id ?? null);
  }

  private monthRange(): { start: string; end: string } {
    const month = this.monthFromKey(this.displayedMonth());
    return {
      start: this.toDateKey(month),
      end: this.toDateKey(new Date(month.getFullYear(), month.getMonth() + 1, 0)),
    };
  }

  private monthFromKey(monthKey: string): Date {
    return new Date(`${monthKey}-01T00:00:00`);
  }

  private toMonthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private toDateKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
}
