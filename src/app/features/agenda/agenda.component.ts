import {
  Component,
  DestroyRef,
  HostListener,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { RegisterSurfaceComponent } from '../../shared/components/register-surface/register-surface.component';
import { AppointmentService } from '../../core/services/appointment.service';
import { ProfessionalService } from '../../core/services/professional.service';
import { ServiceTypeService } from '../../core/services/service-type.service';
import { StudioService } from '../../core/services/studio.service';
import { AuthService } from '../../core/services/auth.service';
import type {
  AppointmentResponse,
  AppointmentStatus,
  ProfessionalResponse,
  ServiceTypeResponse,
  AvailabilityResponse,
  AvailabilityExceptionResponse,
} from '../../core/models/domain.model';

const HOUR_START = 7;
const HOUR_END = 21;
const SLOT_HEIGHT = 96; // 24 px per 15-minute slot
const SNAP_MINUTES = 15;
const MONTHS_IT = [
  'Gennaio',
  'Febbraio',
  'Marzo',
  'Aprile',
  'Maggio',
  'Giugno',
  'Luglio',
  'Agosto',
  'Settembre',
  'Ottobre',
  'Novembre',
  'Dicembre',
];
const PICKER_DAYS = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
const ACTIVE_STATUSES: string[] = ['REQUESTED', 'CONFIRMED', 'PROPOSED_NEW_TIME'];

interface ProfAvailability {
  profId: string;
  slots: AvailabilityResponse[];
  exceptions: AvailabilityExceptionResponse[];
}

type SlotAvailability = { available: true } | { available: false; message: string };

interface PendingBooking {
  professionalId: string;
  professionalName: string;
  date: string;
  time: string;
}

interface UnavailableBlock {
  topPx: number;
  heightPx: number;
  label: string;
}

interface CalendarSlot {
  index: number;
  hour: number;
  minute: number;
  time: string;
  topPx: number;
  heightPx: number;
}

interface CalendarAppointmentLayout {
  appointment: AppointmentResponse;
  leftPercent: number;
  widthPercent: number;
}

interface AgendaWeekDay {
  date: string;
  dayLabel: string;
  dayNum: number;
  monthName: string;
  isToday: boolean;
  appointmentCount: number;
  capacityStatus: 'green' | 'yellow' | 'red' | null;
}

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [
    RouterLink,
    PageShellComponent,
    ButtonComponent,
    BadgeComponent,
    AlertComponent,
    ConfirmDialogComponent,
    EmptyStateComponent,
    RegisterSurfaceComponent,
  ],
  templateUrl: './agenda.component.html',
  styles: [
    `
      .agenda-hatch {
        background-color: color-mix(in srgb, var(--surface-subtle) 58%, var(--surface-card));
        background-image: repeating-linear-gradient(
          45deg,
          transparent,
          transparent 6px,
          color-mix(in srgb, var(--text-tertiary) 9%, transparent) 6px,
          color-mix(in srgb, var(--text-tertiary) 9%, transparent) 12px
        );
      }
    `,
  ],
})
export class AgendaComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly aptService = inject(AppointmentService);
  private readonly profService = inject(ProfessionalService);
  private readonly svcService = inject(ServiceTypeService);
  private readonly studioService = inject(StudioService);
  private readonly authService = inject(AuthService);

  readonly viewMode = signal<'list' | 'calendar'>('calendar');
  readonly currentDate = signal(this.toDateStr(new Date()));
  readonly allAppointments = signal<AppointmentResponse[]>([]);
  readonly activeProfessionals = signal<ProfessionalResponse[]>([]);
  readonly serviceTypes = signal<ServiceTypeResponse[]>([]);
  readonly profAvailabilities = signal<ProfAvailability[]>([]);
  readonly isLoading = signal(true);
  readonly dataError = signal<string | null>(null);
  readonly bookingFeedback = signal<string | null>(null);
  readonly isCheckingBookingSlot = signal(false);
  readonly pendingBooking = signal<PendingBooking | null>(null);
  readonly focusedSlotKey = signal<string | null>(null);
  readonly selectedSlotKey = signal<string | null>(null);
  readonly nowIso = signal(new Date().toISOString());

  // Date picker
  readonly showDatePicker = signal(false);
  readonly calPickerMonth = signal(new Date().getMonth());
  readonly calPickerYear = signal(new Date().getFullYear());
  readonly pickerDays = PICKER_DAYS;

  readonly hourStart = HOUR_START;
  readonly slotHeight = SLOT_HEIGHT;
  readonly hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
  readonly calendarSlots: CalendarSlot[] = Array.from(
    { length: ((HOUR_END - HOUR_START) * 60) / SNAP_MINUTES },
    (_, index) => {
      const totalMinutes = HOUR_START * 60 + index * SNAP_MINUTES;
      const hour = Math.floor(totalMinutes / 60);
      const minute = totalMinutes % 60;
      return {
        index,
        hour,
        minute,
        time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        topPx: index * (SLOT_HEIGHT / (60 / SNAP_MINUTES)),
        heightPx: SLOT_HEIGHT / (60 / SNAP_MINUTES),
      };
    },
  );
  readonly calendarHeight = (HOUR_END - HOUR_START) * SLOT_HEIGHT;
  readonly isMobile = signal(false);
  readonly currentTimeLabel = computed(() =>
    new Date(this.nowIso()).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
  );
  readonly bookingStatusMessage = computed(() => {
    if (this.isCheckingBookingSlot()) return 'Verifica della disponibilità dell’orario in corso.';
    return this.bookingFeedback() ?? '';
  });
  private bookingSlotCheckId = 0;
  private shouldAutoScroll = true;

  readonly dayAppointments = computed(() => {
    const d = this.currentDate();
    return this.allAppointments()
      .filter((a) => a.startDatetime.startsWith(d) && ACTIVE_STATUSES.includes(a.status))
      .sort((a, b) => a.startDatetime.localeCompare(b.startDatetime));
  });

  readonly calendarGridCols = computed(() => {
    const n = this.activeProfessionals().length;
    const minCol = this.isMobile() ? '120px' : '160px';
    return `${this.isMobile() ? 44 : 56}px repeat(${n}, minmax(${minCol}, 1fr))`;
  });

  readonly dateLabel = computed(() => {
    const parts = this.currentDate().split('-');
    const d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    return d.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  });

  readonly isToday = computed(() => this.currentDate() === this.toDateStr(new Date(this.nowIso())));

  readonly calPickerMonthLabel = computed(
    () => `${MONTHS_IT[this.calPickerMonth()]} ${this.calPickerYear()}`,
  );

  readonly calPickerDays = computed(() => {
    const year = this.calPickerYear();
    const month = this.calPickerMonth();
    const firstDay = new Date(year, month, 1);
    let dow = firstDay.getDay();
    if (dow === 0) dow = 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = this.toDateStr(new Date(this.nowIso()));
    const cells: (null | {
      num: number;
      dateStr: string;
      isToday: boolean;
      isSelected: boolean;
    })[] = [];
    for (let i = 1; i < dow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        num: d,
        dateStr,
        isToday: dateStr === todayStr,
        isSelected: dateStr === this.currentDate(),
      });
    }
    return cells;
  });

  readonly weekDays = computed<AgendaWeekDay[]>(() => {
    const todayStr = this.toDateStr(new Date(this.nowIso()));
    const parts = this.currentDate().split('-');
    const cur = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    const dow = cur.getDay() || 7;
    const monday = new Date(cur);
    monday.setDate(cur.getDate() - dow + 1);
    const apts = this.allAppointments();
    const studio = this.studioService.studio();
    const warnThreshold = studio?.warningThreshold ?? null;
    const critThreshold = studio?.criticalThreshold ?? null;
    const hasThresholds = warnThreshold !== null || critThreshold !== null;
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = this.toDateStr(d);
      const appointmentCount = apts.filter(
        (a) => a.startDatetime.startsWith(dateStr) && ACTIVE_STATUSES.includes(a.status),
      ).length;
      let capacityStatus: 'green' | 'yellow' | 'red' | null = null;
      if (hasThresholds) {
        if (critThreshold !== null && appointmentCount >= critThreshold) {
          capacityStatus = 'red';
        } else if (warnThreshold !== null && appointmentCount >= warnThreshold) {
          capacityStatus = 'yellow';
        } else {
          capacityStatus = 'green';
        }
      }
      return {
        date: dateStr,
        dayLabel: d.toLocaleDateString('it-IT', { weekday: 'short' }).replace('.', ''),
        dayNum: d.getDate(),
        monthName: d.toLocaleDateString('it-IT', { month: 'short' }).replace('.', ''),
        isToday: dateStr === todayStr,
        appointmentCount,
        capacityStatus,
      };
    });
  });

  readonly hasCapacityWarnings = computed(() =>
    this.weekDays().some((day) => day.capacityStatus === 'yellow' || day.capacityStatus === 'red'),
  );

  readonly currentTimeTopPx = computed<number | null>(() => {
    if (!this.isToday()) return null;
    const now = new Date(this.nowIso());
    const minutesFromStart = (now.getHours() - HOUR_START) * 60 + now.getMinutes();
    if (minutesFromStart < 0 || minutesFromStart > (HOUR_END - HOUR_START) * 60) return null;
    return (minutesFromStart / 60) * SLOT_HEIGHT;
  });

  ngOnInit(): void {
    this.isMobile.set(window.innerWidth < 640);
    const clockId = window.setInterval(() => this.nowIso.set(new Date().toISOString()), 60_000);
    this.destroyRef.onDestroy(() => window.clearInterval(clockId));
    const user = this.authService.user();
    if (user) {
      this.studioService.getMyStudio(user.studioId).subscribe();
    }
    this.profService.list().subscribe({
      next: (list) => {
        const active = list.filter((p) => p.active);
        this.activeProfessionals.set(active);
        this.scheduleOperationalScroll();
        // Load availability for each professional
        active.forEach((pro) => {
          this.profService.getAvailability(pro.id).subscribe({
            next: (slots) => {
              this.profService.getExceptions(pro.id).subscribe({
                next: (exceptions) => {
                  this.profAvailabilities.update((arr) => [
                    ...arr.filter((a) => a.profId !== pro.id),
                    { profId: pro.id, slots, exceptions },
                  ]);
                },
              });
            },
          });
        });
      },
    });
    this.svcService
      .list()
      .subscribe({ next: (list) => this.serviceTypes.set(list.filter((s) => s.active)) });
    this.loadAppointments();

    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        filter((e) => (e as NavigationEnd).urlAfterRedirects.startsWith('/agenda')),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.loadAppointments());
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.showDatePicker()) {
      this.showDatePicker.set(false);
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.isMobile.set(window.innerWidth < 640);
  }

  openDatePicker(): void {
    const parts = this.currentDate().split('-');
    this.calPickerMonth.set(+parts[1] - 1);
    this.calPickerYear.set(+parts[0]);
    this.showDatePicker.update((v) => !v);
  }

  calPickerPrevMonth(): void {
    if (this.calPickerMonth() === 0) {
      this.calPickerMonth.set(11);
      this.calPickerYear.update((y) => y - 1);
    } else {
      this.calPickerMonth.update((m) => m - 1);
    }
  }

  calPickerNextMonth(): void {
    if (this.calPickerMonth() === 11) {
      this.calPickerMonth.set(0);
      this.calPickerYear.update((y) => y + 1);
    } else {
      this.calPickerMonth.update((m) => m + 1);
    }
  }

  selectPickerDate(dateStr: string): void {
    this.goToDate(dateStr);
    this.showDatePicker.set(false);
  }

  getPickerDayClass(day: { isSelected: boolean; isToday: boolean }): string {
    if (day.isSelected)
      return '!h-11 !w-full !min-h-0 !rounded-sm !border-[var(--color-primary)] !bg-[var(--color-primary)] !p-0 !text-white';
    if (day.isToday)
      return '!h-11 !w-full !min-h-0 !rounded-sm !border-[var(--color-primary)] !p-0 !text-[var(--color-primary)]';
    return '!h-11 !w-full !min-h-0 !rounded-sm !p-0';
  }

  viewModeClass(mode: 'list' | 'calendar'): string {
    const selected =
      this.viewMode() === mode
        ? '!border-[var(--surface-card-border)] !bg-[var(--surface-active-nav)] !text-[var(--color-primary)]'
        : '';
    return `!min-h-11 !rounded-sm !px-3 ${selected}`;
  }

  setViewMode(mode: 'list' | 'calendar'): void {
    this.viewMode.set(mode);
    if (mode === 'calendar' && this.isToday()) {
      this.shouldAutoScroll = true;
      this.scheduleOperationalScroll();
    }
  }

  weekDayClass(day: AgendaWeekDay): string {
    const selected =
      day.date === this.currentDate()
        ? '!border-[var(--color-primary)] !bg-[var(--color-primary)] !text-white'
        : '!border-transparent !bg-transparent hover:!bg-[var(--surface-hover)]';
    return `relative h-auto min-h-[72px] w-full !flex-col !gap-0.5 !rounded-none !px-2 !py-2 ${selected}`;
  }

  weekDayAriaLabel(day: AgendaWeekDay): string {
    const date = new Date(`${day.date}T00:00:00`).toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    const capacity = day.capacityStatus ? `, carico ${this.capacityLabel(day.capacityStatus)}` : '';
    return `${date}: ${day.appointmentCount} appuntamenti${capacity}`;
  }

  capacityMarkerClass(status: 'green' | 'yellow' | 'red'): string {
    const map: Record<'green' | 'yellow' | 'red', string> = {
      green: 'bg-[var(--color-register)]',
      yellow: 'bg-[var(--status-warning-text)]',
      red: 'bg-[var(--status-danger-text)]',
    };
    return map[status];
  }

  hasCapacityStatus(status: 'yellow' | 'red'): boolean {
    return this.weekDays().some((day) => day.capacityStatus === status);
  }

  goToTodayOrNow(): void {
    if (this.isToday()) {
      this.scrollToOperationalTime(true);
      return;
    }
    this.goToDate(this.toDateStr(new Date(this.nowIso())));
  }

  prevDay(): void {
    this.shiftDate(-1);
  }
  nextDay(): void {
    this.shiftDate(1);
  }

  goToDate(date: string): void {
    this.resetBookingSelection();
    this.currentDate.set(date);
    this.shouldAutoScroll = date === this.toDateStr(new Date(this.nowIso()));
    this.loadAppointments();
  }

  slotKey(professionalId: string, slotIndex: number): string {
    return `${professionalId}:${slotIndex}`;
  }

  slotButtonId(professionalId: string, slotIndex: number): string {
    return `agenda-slot-${professionalId}-${slotIndex}`;
  }

  slotTabIndex(professionalId: string, slotIndex: number): number {
    const focused = this.focusedSlotKey();
    if (focused) return focused === this.slotKey(professionalId, slotIndex) ? 0 : -1;
    return this.activeProfessionals()[0]?.id === professionalId && slotIndex === 0 ? 0 : -1;
  }

  slotAriaLabel(professional: ProfessionalResponse, slot: CalendarSlot): string {
    const availability = this.getSlotAvailability(professional.id, slot.hour, slot.minute);
    const status = availability.available ? 'disponibile' : availability.message;
    return `${professional.firstName} ${professional.lastName}, ${this.formatDate(this.currentDate())}, ore ${slot.time}: ${status}`;
  }

  slotButtonClass(professionalId: string, slotIndex: number): string {
    const selected =
      this.selectedSlotKey() === this.slotKey(professionalId, slotIndex)
        ? '!bg-[var(--surface-active-nav)]'
        : '';
    return `group !relative !h-full !min-h-0 !w-full !rounded-none !border-0 !p-0 hover:!bg-[var(--surface-hover)] focus-visible:!z-[8] focus-visible:!bg-[var(--surface-active-nav)] ${selected}`;
  }

  slotFeedbackClass(professionalId: string): string {
    const professionals = this.activeProfessionals();
    const alignsRight = professionals.at(-1)?.id === professionalId;
    const alignment = alignsRight ? 'right-2' : 'left-2';
    return `pointer-events-none absolute top-full z-30 mt-1 w-56 max-w-[calc(100vw-2rem)] border border-[var(--status-warning-text)] bg-[var(--surface-card)] p-2 text-left text-xs font-medium leading-snug text-[var(--text-primary)] shadow-sm ${alignment}`;
  }

  onSlotFocus(professionalId: string, slotIndex: number): void {
    this.focusedSlotKey.set(this.slotKey(professionalId, slotIndex));
  }

  onSlotKeydown(event: KeyboardEvent, professionalId: string, slotIndex: number): void {
    const professionals = this.activeProfessionals();
    const professionalIndex = professionals.findIndex(
      (professional) => professional.id === professionalId,
    );
    let nextProfessionalIndex = professionalIndex;
    let nextSlotIndex = slotIndex;

    switch (event.key) {
      case 'ArrowUp':
        nextSlotIndex--;
        break;
      case 'ArrowDown':
        nextSlotIndex++;
        break;
      case 'PageUp':
        nextSlotIndex -= 4;
        break;
      case 'PageDown':
        nextSlotIndex += 4;
        break;
      case 'ArrowLeft':
        nextProfessionalIndex--;
        break;
      case 'ArrowRight':
        nextProfessionalIndex++;
        break;
      case 'Home':
        nextSlotIndex = 0;
        break;
      case 'End':
        nextSlotIndex = this.calendarSlots.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    nextProfessionalIndex = Math.min(Math.max(nextProfessionalIndex, 0), professionals.length - 1);
    nextSlotIndex = Math.min(Math.max(nextSlotIndex, 0), this.calendarSlots.length - 1);
    const nextProfessional = professionals[nextProfessionalIndex];
    if (!nextProfessional) return;
    this.focusCalendarSlot(nextProfessional.id, nextSlotIndex);
  }

  selectCalendarSlot(professionalId: string, slot: CalendarSlot): void {
    this.bookingSlotCheckId++;
    this.isCheckingBookingSlot.set(false);
    this.pendingBooking.set(null);
    this.bookingFeedback.set(null);
    this.selectedSlotKey.set(this.slotKey(professionalId, slot.index));
    const availability = this.getSlotAvailability(professionalId, slot.hour, slot.minute);
    if (!availability.available) {
      this.bookingFeedback.set(availability.message);
      return;
    }

    const date = this.currentDate();
    this.verifyBookingSlot(professionalId, date, slot.time);
  }

  cancelBooking(): void {
    this.pendingBooking.set(null);
    this.selectedSlotKey.set(null);
  }

  continueBooking(): void {
    const booking = this.pendingBooking();
    if (!booking) return;

    this.router.navigate(['/appuntamenti/nuovo'], {
      queryParams: {
        date: booking.date,
        time: booking.time,
        professionalId: booking.professionalId,
      },
    });
  }

  private getSlotAvailability(
    professionalId: string,
    hour: number,
    minute: number,
  ): SlotAvailability {
    if (hour < HOUR_START || hour >= HOUR_END) {
      return {
        available: false,
        message: `Puoi creare appuntamenti solo tra le ${String(HOUR_START).padStart(2, '0')}:00 e le ${String(HOUR_END).padStart(2, '0')}:00.`,
      };
    }

    const avail = this.profAvailabilities().find((a) => a.profId === professionalId);
    if (!avail) {
      return {
        available: false,
        message:
          'La disponibilità del professionista è ancora in caricamento. Riprova tra qualche istante.',
      };
    }

    const parts = this.currentDate().split('-');
    const dayDate = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    let dayOfWeek = dayDate.getDay();
    if (dayOfWeek === 0) dayOfWeek = 7; // Sun = 7

    // Check exceptions first
    const exception = avail.exceptions.find((e) => e.date === this.currentDate());
    if (exception) {
      if (exception.isUnavailableAllDay) {
        return {
          available: false,
          message: 'Il professionista non è disponibile in questa giornata.',
        };
      }
      if (exception.slots.length > 0) {
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        const inExcSlot = exception.slots.some(
          (s) => timeStr >= s.startTime && timeStr < s.endTime,
        );
        if (inExcSlot) {
          return {
            available: false,
            message: 'Questo orario non è disponibile a causa di un’eccezione in agenda.',
          };
        }
      }
    }

    // Check regular availability
    const slot = avail.slots.find((s) => s.dayOfWeek === dayOfWeek);
    if (!slot) {
      return { available: false, message: 'Il professionista non lavora in questa giornata.' };
    }

    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    if (timeStr < slot.startTime || timeStr >= slot.endTime) {
      return {
        available: false,
        message: `Il professionista è disponibile dalle ${slot.startTime} alle ${slot.endTime}.`,
      };
    }

    return { available: true };
  }

  private verifyBookingSlot(professionalId: string, date: string, time: string): void {
    const requestId = ++this.bookingSlotCheckId;
    this.isCheckingBookingSlot.set(true);

    this.profService.getAvailableSlots(professionalId, date, 5).subscribe({
      next: (slots) => {
        if (requestId !== this.bookingSlotCheckId) return;

        this.isCheckingBookingSlot.set(false);
        const isStillAvailable = slots.some((slot) => this.formatSlotTime(slot.start) === time);
        if (!isStillAvailable) {
          this.bookingFeedback.set('Questo orario non è più disponibile. Scegline un altro.');
          return;
        }

        const professional = this.activeProfessionals().find((pro) => pro.id === professionalId);
        this.pendingBooking.set({
          professionalId,
          professionalName: professional
            ? `${professional.firstName} ${professional.lastName}`
            : 'Professionista selezionato',
          date,
          time,
        });
      },
      error: () => {
        if (requestId !== this.bookingSlotCheckId) return;
        this.isCheckingBookingSlot.set(false);
        this.bookingFeedback.set(
          'Non è possibile verificare la disponibilità in questo momento. Riprova tra qualche istante.',
        );
      },
    });
  }

  /** Get unavailable time blocks for a professional on the current date (for overlay rendering) */
  getUnavailableBlocks(professionalId: string): UnavailableBlock[] {
    const avail = this.profAvailabilities().find((a) => a.profId === professionalId);
    if (!avail) return [];

    const parts = this.currentDate().split('-');
    const dayDate = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    let dayOfWeek = dayDate.getDay();
    if (dayOfWeek === 0) dayOfWeek = 7;

    // Check for exception
    const exception = avail.exceptions.find((e) => e.date === this.currentDate());
    if (exception?.isUnavailableAllDay) {
      return [
        {
          topPx: 0,
          heightPx: this.calendarHeight,
          label: exception.reason?.trim() || 'Non disponibile oggi',
        },
      ];
    }

    // If the exception has specific unavailable slots, overlay those on top of regular availability
    const slot = avail.slots.find((s) => s.dayOfWeek === dayOfWeek);
    if (!slot) {
      return [{ topPx: 0, heightPx: this.calendarHeight, label: 'Non lavora oggi' }];
    }

    const blocks: UnavailableBlock[] = [];
    const toMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const availStart = slot.startTime;
    const availEnd = slot.endTime;
    const startMin = toMinutes(availStart);
    const endMin = toMinutes(availEnd);
    const calStartMin = HOUR_START * 60;
    const calEndMin = HOUR_END * 60;

    // Block before available time
    if (startMin > calStartMin) {
      const topPx = 0;
      const heightPx = ((startMin - calStartMin) / 60) * SLOT_HEIGHT;
      blocks.push({
        topPx,
        heightPx,
        label: `Prenotabile dalle ${this.formatAvailabilityTime(availStart)}`,
      });
    }

    // Block after available time
    if (endMin < calEndMin) {
      const topPx = ((endMin - calStartMin) / 60) * SLOT_HEIGHT;
      const heightPx = ((calEndMin - endMin) / 60) * SLOT_HEIGHT;
      blocks.push({
        topPx,
        heightPx,
        label: `Prenotabile fino alle ${this.formatAvailabilityTime(availEnd)}`,
      });
    }

    // Add exception slot blocks (unavailable ranges within the working day)
    if (exception && exception.slots.length > 0) {
      for (const excSlot of exception.slots) {
        const excStartMin = toMinutes(excSlot.startTime);
        const excEndMin = toMinutes(excSlot.endTime);
        const topPx = ((Math.max(excStartMin, calStartMin) - calStartMin) / 60) * SLOT_HEIGHT;
        const bottomPx = ((Math.min(excEndMin, calEndMin) - calStartMin) / 60) * SLOT_HEIGHT;
        if (bottomPx > topPx) {
          blocks.push({
            topPx,
            heightPx: bottomPx - topPx,
            label: exception.reason?.trim() || 'Non disponibile',
          });
        }
      }
    }

    return blocks;
  }

  appointmentsForProfessional(professionalId: string): AppointmentResponse[] {
    const d = this.currentDate();
    return this.allAppointments()
      .filter(
        (a) =>
          a.professionalId === professionalId &&
          a.startDatetime.startsWith(d) &&
          ACTIVE_STATUSES.includes(a.status),
      )
      .sort((a, b) => a.startDatetime.localeCompare(b.startDatetime));
  }

  calendarAppointmentLayouts(professionalId: string): CalendarAppointmentLayout[] {
    const appointments = this.appointmentsForProfessional(professionalId);
    const groups: AppointmentResponse[][] = [];
    let currentGroup: AppointmentResponse[] = [];
    let currentGroupEnd = Number.NEGATIVE_INFINITY;

    for (const appointment of appointments) {
      const start = new Date(appointment.startDatetime).getTime();
      const end = new Date(appointment.endDatetime).getTime();
      if (currentGroup.length > 0 && start >= currentGroupEnd) {
        groups.push(currentGroup);
        currentGroup = [];
        currentGroupEnd = Number.NEGATIVE_INFINITY;
      }
      currentGroup.push(appointment);
      currentGroupEnd = Math.max(currentGroupEnd, end);
    }
    if (currentGroup.length > 0) groups.push(currentGroup);

    return groups.flatMap((group) => this.layoutOverlapGroup(group));
  }

  calendarTop(apt: AppointmentResponse): number {
    const d = new Date(apt.startDatetime);
    const minutesFromStart = (d.getHours() - HOUR_START) * 60 + d.getMinutes();
    return (minutesFromStart / 60) * SLOT_HEIGHT;
  }

  calendarBlockHeight(apt: AppointmentResponse): number {
    const start = new Date(apt.startDatetime).getTime();
    const end = new Date(apt.endDatetime).getTime();
    const durationMinutes = (end - start) / 60000;
    return Math.max(24, (durationMinutes / 60) * SLOT_HEIGHT);
  }

  durationMinutes(appointment: AppointmentResponse): number {
    const start = new Date(appointment.startDatetime).getTime();
    const end = new Date(appointment.endDatetime).getTime();
    return Math.max(0, Math.round((end - start) / 60_000));
  }

  isCompactAppointment(apt: AppointmentResponse): boolean {
    const start = new Date(apt.startDatetime).getTime();
    const end = new Date(apt.endDatetime).getTime();
    const durationMinutes = (end - start) / 60000;
    return durationMinutes <= 15;
  }

  aptBorder(apt: AppointmentResponse): string {
    return apt.serviceTypeColor || 'var(--surface-card-border)';
  }

  calendarAppointmentLabel(appointment: AppointmentResponse): string {
    return `${this.formatTime(appointment.startDatetime)}, ${appointment.clientFullName}, ${appointment.serviceTypeName || 'servizio non specificato'}, ${this.statusLabel(appointment.status)}`;
  }

  retryAgenda(): void {
    this.loadAppointments();
  }

  private shiftDate(days: number): void {
    this.resetBookingSelection();
    const parts = this.currentDate().split('-');
    const d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    d.setDate(d.getDate() + days);
    this.currentDate.set(this.toDateStr(d));
    this.shouldAutoScroll = false;
    this.loadAppointments();
  }

  private resetBookingSelection(): void {
    this.bookingSlotCheckId++;
    this.isCheckingBookingSlot.set(false);
    this.pendingBooking.set(null);
    this.bookingFeedback.set(null);
    this.selectedSlotKey.set(null);
  }

  private loadAppointments(): void {
    this.isLoading.set(true);
    this.dataError.set(null);
    const bounds = this.getWeekBounds(this.currentDate());
    this.aptService.list(0, 1000, undefined, undefined, bounds.start, bounds.end).subscribe({
      next: (page) => {
        this.allAppointments.set(page.content);
        this.isLoading.set(false);
        this.scheduleOperationalScroll();
      },
      error: () => {
        this.dataError.set(
          'Non è stato possibile caricare l’agenda. Controlla la connessione e riprova.',
        );
        this.isLoading.set(false);
      },
    });
  }

  private getWeekBounds(dateStr: string): { start: string; end: string } {
    const parts = dateStr.split('-');
    const cur = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    const dow = cur.getDay() || 7;
    const monday = new Date(cur);
    monday.setDate(cur.getDate() - dow + 1);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: this.toDateStr(monday), end: this.toDateStr(sunday) };
  }

  private toDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(date: string): string {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('it-IT', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    });
  }

  bookingConfirmationMessage(): string {
    const booking = this.pendingBooking();
    if (!booking) return '';

    return `${booking.professionalName} · ${booking.time} · ${this.formatDate(booking.date)}. L’orario di inizio è libero; continua per scegliere servizio e cliente. La durata sarà verificata con il servizio selezionato.`;
  }

  private layoutOverlapGroup(group: AppointmentResponse[]): CalendarAppointmentLayout[] {
    const columnEnds: number[] = [];
    const placements = group.map((appointment) => {
      const start = new Date(appointment.startDatetime).getTime();
      const end = new Date(appointment.endDatetime).getTime();
      let columnIndex = columnEnds.findIndex((columnEnd) => columnEnd <= start);
      if (columnIndex === -1) {
        columnIndex = columnEnds.length;
        columnEnds.push(end);
      } else {
        columnEnds[columnIndex] = end;
      }
      return { appointment, columnIndex };
    });
    const columnCount = Math.max(columnEnds.length, 1);
    return placements.map(({ appointment, columnIndex }) => ({
      appointment,
      leftPercent: (columnIndex / columnCount) * 100,
      widthPercent: 100 / columnCount,
    }));
  }

  private focusCalendarSlot(professionalId: string, slotIndex: number): void {
    const slotKey = this.slotKey(professionalId, slotIndex);
    this.focusedSlotKey.set(slotKey);
    window.requestAnimationFrame(() => {
      document.getElementById(this.slotButtonId(professionalId, slotIndex))?.focus();
    });
  }

  private scheduleOperationalScroll(): void {
    if (
      !this.shouldAutoScroll ||
      this.viewMode() !== 'calendar' ||
      !this.isToday() ||
      this.isLoading() ||
      this.activeProfessionals().length === 0
    )
      return;
    this.shouldAutoScroll = false;
    window.requestAnimationFrame(() => this.scrollToOperationalTime(false));
  }

  private scrollToOperationalTime(smooth: boolean): void {
    if (this.viewMode() !== 'calendar' || !this.isToday()) return;
    const now = new Date(this.nowIso()).getTime();
    const nextAppointment = this.dayAppointments().find(
      (appointment) => new Date(appointment.endDatetime).getTime() > now,
    );
    const nowDate = new Date(this.nowIso());
    const minutesFromStart = (nowDate.getHours() - HOUR_START) * 60 + nowDate.getMinutes();
    const currentSlotIndex = Math.min(
      Math.max(Math.floor(minutesFromStart / SNAP_MINUTES), 0),
      this.calendarSlots.length - 1,
    );
    const firstProfessionalId = this.activeProfessionals()[0]?.id;
    const target = nextAppointment
      ? document.getElementById(`agenda-appointment-${nextAppointment.id}`)
      : (document.getElementById('agenda-current-time-anchor') ??
        (firstProfessionalId
          ? document.getElementById(this.slotButtonId(firstProfessionalId, currentSlotIndex))
          : null));
    target?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center' });
  }

  private formatSlotTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: this.studioService.studio()?.timezone ?? 'Europe/Rome',
    });
  }

  private formatAvailabilityTime(time: string): string {
    const [hours = '00', minutes = '00'] = time.split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  }

  private capacityLabel(status: 'green' | 'yellow' | 'red'): string {
    const map: Record<'green' | 'yellow' | 'red', string> = {
      green: 'regolare',
      yellow: 'vicino al limite',
      red: 'limite raggiunto',
    };
    return map[status];
  }

  statusLabel(status: AppointmentStatus): string {
    const map: Record<string, string> = {
      REQUESTED: 'Da confermare',
      CONFIRMED: 'Confermato',
      PROPOSED_NEW_TIME: 'Proposta',
      CANCELLED: 'Cancellato',
      COMPLETED: 'Completato',
      NO_SHOW: 'Non presentato',
    };
    return map[status] ?? status;
  }

  statusVariant(status: AppointmentStatus): 'amber' | 'green' | 'blue' | 'red' | 'gray' | 'purple' {
    const map: Record<string, 'amber' | 'green' | 'blue' | 'red' | 'gray' | 'purple'> = {
      REQUESTED: 'amber',
      CONFIRMED: 'green',
      PROPOSED_NEW_TIME: 'blue',
      CANCELLED: 'red',
      COMPLETED: 'gray',
      NO_SHOW: 'purple',
    };
    return map[status] ?? 'gray';
  }
}
