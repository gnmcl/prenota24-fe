import { Component, HostListener, inject, OnInit, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
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
const SLOT_HEIGHT = 60; // px per hour
const SNAP_MINUTES = 5; // snap to 5 min grid
const MONTHS_IT = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
const PICKER_DAYS = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
const ACTIVE_STATUSES: string[] = ['REQUESTED', 'CONFIRMED', 'PROPOSED_NEW_TIME'];

interface ProfAvailability {
  profId: string;
  slots: AvailabilityResponse[];
  exceptions: AvailabilityExceptionResponse[];
}

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [RouterLink, PageShellComponent, CardComponent, ButtonComponent, BadgeComponent],
  template: `
    <app-page-shell>
      <div class="mx-auto" [class]="viewMode() === 'calendar' ? 'max-w-full' : 'max-w-4xl'">
        <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 class="text-xl sm:text-2xl font-bold text-gray-900">Agenda</h2>
            <p class="mt-1 text-sm text-gray-500">I tuoi appuntamenti</p>
          </div>
          <div class="flex items-center gap-2">
            <a routerLink="/appuntamenti/nuovo">
              <app-button>
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                <span class="hidden sm:inline">Nuovo appuntamento</span>
                <span class="sm:hidden">Nuovo</span>
              </app-button>
            </a>
            <div class="flex gap-1 rounded-lg border border-gray-200 p-0.5 bg-white">
              <button (click)="viewMode.set('list')"
                [class]="viewMode() === 'list'
                  ? 'rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm'
                  : 'rounded-md px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors'">
                Lista
              </button>
              <button (click)="viewMode.set('calendar')"
                [class]="viewMode() === 'calendar'
                  ? 'rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm'
                  : 'rounded-md px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors'">
                Calendario
              </button>
            </div>
          </div>
        </div>

        <!-- Day navigation -->
        <div class="mb-4 flex items-center gap-4">
          <button (click)="prevDay()"
            class="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors shrink-0 shadow-sm">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <div class="relative flex-1 text-center">
            <h3 class="text-base sm:text-lg font-semibold text-gray-900 inline-flex items-center gap-2">
              {{ dateLabel() }}
              <button (click)="$event.stopPropagation(); openDatePicker()"
                class="inline-flex items-center justify-center rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 transition-colors"
                title="Scegli data">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </button>
            </h3>
            @if (isToday()) {
              <span class="block text-xs text-indigo-600 font-medium">Oggi</span>
            }
            <!-- Date picker popover -->
            @if (showDatePicker()) {
              <div (click)="$event.stopPropagation()"
                class="absolute left-1/2 top-full mt-2 z-50 w-72 -translate-x-1/2 rounded-2xl border border-gray-200 bg-white shadow-xl">
                <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <button (click)="calPickerPrevMonth()" type="button"
                    class="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                    </svg>
                  </button>
                  <span class="text-sm font-semibold text-gray-900">{{ calPickerMonthLabel() }}</span>
                  <button (click)="calPickerNextMonth()" type="button"
                    class="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
                <div class="grid grid-cols-7 px-2 pt-2">
                  @for (day of pickerDays; track $index) {
                    <div class="py-1 text-center text-[10px] font-medium text-gray-400 uppercase">{{ day }}</div>
                  }
                </div>
                <div class="grid grid-cols-7 px-2 pb-3">
                  @for (day of calPickerDays(); track $index) {
                    @if (day) {
                      <button (click)="selectPickerDate(day.dateStr)" type="button"
                        [class]="getPickerDayClass(day)"
                        class="py-1.5 text-center text-sm transition-all duration-100 rounded-lg">
                        {{ day.num }}
                      </button>
                    } @else {
                      <div class="py-1.5"></div>
                    }
                  }
                </div>
              </div>
            }
          </div>
          <button (click)="nextDay()"
            class="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors shrink-0 shadow-sm">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>

        <!-- Week day quick nav -->
        <div class="mb-6 grid grid-cols-7 gap-1">
          @for (d of weekDays(); track d.date) {
            <button (click)="goToDate(d.date)" class="relative"
              [class]="d.date === currentDate()
                ? 'rounded-xl bg-indigo-600 px-1 sm:px-2 py-2 text-center text-white shadow-sm'
                : d.isToday
                  ? 'rounded-xl border-2 border-indigo-300 px-1 sm:px-2 py-2 text-center text-indigo-700 hover:bg-indigo-50 transition-colors'
                  : 'rounded-xl border border-gray-200 px-1 sm:px-2 py-2 text-center text-gray-700 hover:bg-gray-50 transition-colors'">
              @if (d.capacityStatus) {
                <span class="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white"
                  [class]="d.capacityStatus === 'red' ? 'bg-red-500' : d.capacityStatus === 'yellow' ? 'bg-amber-400' : 'bg-emerald-500'">
                </span>
              }
              <div class="text-[10px] sm:text-xs">{{ d.dayLabel }}</div>
              <div class="text-sm font-semibold">{{ d.dayNum }}</div>
              @if (d.appointmentCount > 0) {
                <div class="mt-0.5 flex justify-center">
                  <span class="inline-flex items-center justify-center rounded-full px-1.5 py-0 text-[9px] font-semibold leading-4 min-w-[16px]"
                    [class]="d.date === currentDate() ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'">
                    {{ d.appointmentCount }}
                  </span>
                </div>
              }
            </button>
          }
        </div>

        @if (isLoading()) {
          <div class="flex justify-center py-12">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
          </div>
        } @else {
          <!-- LIST VIEW -->
          @if (viewMode() === 'list') {
            @if (dayAppointments().length === 0) {
              <app-card extraClass="text-center">
                <p class="text-gray-400 mb-2">Nessun appuntamento per questa giornata</p>
              </app-card>
            } @else {
              <div class="space-y-3">
                @for (apt of dayAppointments(); track apt.id) {
                  <a [routerLink]="['/appuntamenti', apt.id]">
                    <app-card extraClass="hover:shadow-md transition-shadow !p-4 sm:!p-5">
                      <div class="flex items-center gap-3 sm:gap-4">
                        <div class="flex flex-col items-center rounded-xl bg-gradient-to-b from-indigo-50 to-indigo-100/50 px-2.5 py-1.5 sm:px-3 sm:py-2 text-center shrink-0">
                          <span class="text-base sm:text-lg font-bold text-indigo-700">{{ formatTime(apt.startDatetime) }}</span>
                          <span class="text-[10px] sm:text-xs text-indigo-500">{{ formatTime(apt.endDatetime) }}</span>
                        </div>
                        <div class="min-w-0 flex-1">
                          <div class="flex items-center gap-2 flex-wrap">
                            <span class="font-semibold text-gray-900 truncate">{{ apt.clientFullName }}</span>
                            <app-badge [variant]="statusVariant(apt.status)">{{ statusLabel(apt.status) }}</app-badge>
                          </div>
                          <div class="mt-0.5 text-sm text-gray-500 truncate">
                            @if (apt.serviceTypeName) {
                              {{ apt.serviceTypeName }} ·
                            }
                            {{ apt.professionalFullName }}
                          </div>
                        </div>
                        <svg class="h-4 w-4 text-gray-400 shrink-0 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                      </div>
                    </app-card>
                  </a>
                }
              </div>
            }
          }

          <!-- CALENDAR VIEW -->
          @if (viewMode() === 'calendar') {
            <!-- Legend -->
            @if (serviceTypes().length > 0) {
              <div class="mb-4 flex flex-wrap items-center gap-3 px-1">
                <span class="text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-wider">Servizi:</span>
                @for (svc of serviceTypes(); track svc.id) {
                  <div class="flex items-center gap-1.5">
                    <span class="h-2.5 w-2.5 rounded-full shrink-0" [style.background-color]="svc.color || '#D1D5DB'"></span>
                    <span class="text-[10px] sm:text-xs text-gray-600">{{ svc.name }}</span>
                  </div>
                }
              </div>
            }

            @if (activeProfessionals().length === 0) {
              <app-card extraClass="text-center">
                <p class="text-gray-400">Nessun professionista attivo nello studio.</p>
              </app-card>
            } @else {
              <div class="rounded-2xl border border-gray-200/80 bg-white overflow-x-auto -mx-4 sm:mx-0 shadow-[var(--shadow-card)]">
                <!-- Header: professional names -->
                <div class="grid border-b border-gray-200 sticky top-0 bg-white z-10" [style.grid-template-columns]="calendarGridCols()">
                  <div class="border-r border-gray-100 bg-gray-50/80 min-w-[44px] sm:min-w-[56px]"></div>
                  @for (pro of activeProfessionals(); track pro.id) {
                    <div class="border-r border-gray-100 px-2 sm:px-3 py-2 sm:py-3 text-center last:border-r-0 min-w-[100px] sm:min-w-[140px]">
                      <div class="text-xs sm:text-sm font-semibold text-gray-900 truncate">{{ pro.firstName }} {{ pro.lastName }}</div>
                    </div>
                  }
                </div>
                <!-- Body -->
                <div class="relative grid" [style.grid-template-columns]="calendarGridCols()" [style.height.px]="calendarHeight">
                  <!-- Time labels -->
                  <div class="border-r border-gray-100 min-w-[44px] sm:min-w-[56px]">
                    @for (h of hours; track h) {
                      <div class="absolute pr-1 sm:pr-2 text-right text-[10px] sm:text-xs text-gray-400 font-medium"
                        [style.top.px]="(h - hourStart) * slotHeight"
                        [style.width.px]="isMobile ? 44 : 56"
                        [style.line-height.px]="0">
                        {{ h }}:00
                      </div>
                    }
                  </div>
                  <!-- Professional columns -->
                  @for (pro of activeProfessionals(); track pro.id) {
                    <div class="relative border-r border-gray-100 last:border-r-0 min-w-[100px] sm:min-w-[140px]">
                      <!-- Hour grid lines -->
                      @for (h of hours; track h) {
                        <div class="absolute inset-x-0 border-t border-gray-100"
                          [style.top.px]="(h - hourStart) * slotHeight">
                        </div>
                        <div class="absolute inset-x-0 border-t border-gray-50"
                          [style.top.px]="(h - hourStart) * slotHeight + slotHeight / 2">
                        </div>
                      }

                      <!-- Unavailability overlays -->
                      @for (block of getUnavailableBlocks(pro.id); track $index) {
                        <div class="absolute inset-x-0 z-[2] pointer-events-none"
                          [style.top.px]="block.topPx"
                          [style.height.px]="block.heightPx">
                          <div class="h-full w-full bg-gray-200/40" style="background-image: repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(156,163,175,0.15) 4px, rgba(156,163,175,0.15) 8px)"></div>
                        </div>
                      }

                      <!-- Clickable area (continuous, computes precise time from Y pos) -->
                      <div class="absolute inset-0 z-[3] cursor-pointer"
                        (click)="onColumnClick($event, pro.id)">
                      </div>

                      <!-- Appointments (on top of clickable area) -->
                      @for (apt of appointmentsForProfessional(pro.id); track apt.id) {
                        <a [routerLink]="['/appuntamenti', apt.id]"
                          class="absolute inset-x-0.5 mx-0.5 rounded-lg px-1.5 sm:px-2 py-0.5 text-xs overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border-l-[3px] z-[6] shadow-sm"
                          [style.top.px]="calendarTop(apt)"
                          [style.height.px]="calendarBlockHeight(apt)"
                          [style.min-height.px]="22"
                          [style.background-color]="aptBg(apt)"
                          [style.border-left-color]="aptBorder(apt)">
                          <div class="font-semibold truncate leading-tight text-gray-900 text-[10px] sm:text-xs">
                            {{ formatTime(apt.startDatetime) }} {{ apt.clientFullName }}
                          </div>
                          @if (calendarBlockHeight(apt) > 30) {
                            <div class="truncate text-[9px] sm:text-[10px] leading-tight text-gray-600">
                              {{ apt.serviceTypeName || 'Nessun servizio' }}
                            </div>
                          }
                          @if (calendarBlockHeight(apt) > 44) {
                            <div class="mt-0.5">
                              <span class="inline-flex items-center rounded-full px-1.5 py-0.5 text-[8px] sm:text-[9px] font-medium"
                                [style.background-color]="statusBg(apt.status)"
                                [style.color]="statusTextColor(apt.status)">
                                {{ statusLabel(apt.status) }}
                              </span>
                            </div>
                          }
                        </a>
                      }
                    </div>
                  }
                </div>
              </div>
            }
          }
        }
      </div>
    </app-page-shell>
  `,
})
export class AgendaComponent implements OnInit {
  private readonly router = inject(Router);
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

  // Date picker
  readonly showDatePicker = signal(false);
  readonly calPickerMonth = signal(new Date().getMonth());
  readonly calPickerYear = signal(new Date().getFullYear());
  readonly pickerDays = PICKER_DAYS;

  readonly hourStart = HOUR_START;
  readonly slotHeight = SLOT_HEIGHT;
  readonly hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
  readonly calendarHeight = (HOUR_END - HOUR_START) * SLOT_HEIGHT;
  isMobile = false;

  readonly dayAppointments = computed(() => {
    const d = this.currentDate();
    return this.allAppointments()
      .filter((a) => a.startDatetime.startsWith(d))
      .sort((a, b) => a.startDatetime.localeCompare(b.startDatetime));
  });

  readonly calendarGridCols = computed(() => {
    const n = this.activeProfessionals().length;
    const minCol = this.isMobile ? '100px' : '140px';
    return `${this.isMobile ? 44 : 56}px repeat(${n}, minmax(${minCol}, 1fr))`;
  });

  readonly dateLabel = computed(() => {
    const parts = this.currentDate().split('-');
    const d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    return d.toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  });

  readonly isToday = computed(() => this.currentDate() === this.toDateStr(new Date()));

  readonly calPickerMonthLabel = computed(() => `${MONTHS_IT[this.calPickerMonth()]} ${this.calPickerYear()}`);

  readonly calPickerDays = computed(() => {
    const year = this.calPickerYear();
    const month = this.calPickerMonth();
    const firstDay = new Date(year, month, 1);
    let dow = firstDay.getDay();
    if (dow === 0) dow = 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = this.toDateStr(new Date());
    const cells: (null | { num: number; dateStr: string; isToday: boolean; isSelected: boolean })[] = [];
    for (let i = 1; i < dow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ num: d, dateStr, isToday: dateStr === todayStr, isSelected: dateStr === this.currentDate() });
    }
    return cells;
  });

  readonly weekDays = computed(() => {
    const todayStr = this.toDateStr(new Date());
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
        (a) => a.startDatetime.startsWith(dateStr) && ACTIVE_STATUSES.includes(a.status)
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
        dayLabel: d.toLocaleDateString('it-IT', { weekday: 'short' }),
        dayNum: d.getDate(),
        isToday: dateStr === todayStr,
        appointmentCount,
        capacityStatus,
      };
    });
  });

  ngOnInit(): void {
    this.isMobile = window.innerWidth < 640;
    const user = this.authService.user();
    if (user) {
      this.studioService.getMyStudio(user.studioId).subscribe();
    }
    this.profService.list().subscribe({
      next: (list) => {
        const active = list.filter((p) => p.active);
        this.activeProfessionals.set(active);
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
    this.svcService.list().subscribe({ next: (list) => this.serviceTypes.set(list.filter((s) => s.active)) });
    this.loadAppointments();
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.showDatePicker()) {
      this.showDatePicker.set(false);
    }
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
    if (day.isSelected) return 'bg-indigo-600 text-white font-semibold';
    if (day.isToday) return 'text-indigo-600 font-bold ring-2 ring-inset ring-indigo-300';
    return 'text-gray-700 hover:bg-gray-100';
  }

  prevDay(): void { this.shiftDate(-1); }
  nextDay(): void { this.shiftDate(1); }

  goToDate(date: string): void {
    this.currentDate.set(date);
    this.loadAppointments();
  }

  /** Click anywhere on a professional's column → compute precise time from Y position */
  onColumnClick(event: MouseEvent, professionalId: string): void {
    // Don't handle if clicking on an appointment link (those have z-index above)
    const target = event.target as HTMLElement;
    if (target.tagName === 'A' || target.closest('a')) return;

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const clickY = event.clientY - rect.top;

    // Convert pixel position to minutes from hourStart
    const totalMinutesFromStart = (clickY / SLOT_HEIGHT) * 60;
    const rawMinutes = HOUR_START * 60 + totalMinutesFromStart;

    // Snap to nearest SNAP_MINUTES
    const snappedMinutes = Math.round(rawMinutes / SNAP_MINUTES) * SNAP_MINUTES;
    const hours = Math.floor(snappedMinutes / 60);
    const minutes = snappedMinutes % 60;

    // Check if this time is within the professional's availability
    if (!this.isTimeAvailable(professionalId, hours, minutes)) return;

    const date = this.currentDate();
    const time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    this.router.navigate(['/appuntamenti/nuovo'], {
      queryParams: { date, time, professionalId },
    });
  }

  /** Check if a specific time is within the professional's availability for current day */
  isTimeAvailable(professionalId: string, hour: number, minute: number): boolean {
    const avail = this.profAvailabilities().find((a) => a.profId === professionalId);
    if (!avail) return true; // No availability data = available

    const parts = this.currentDate().split('-');
    const dayDate = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    let dayOfWeek = dayDate.getDay();
    if (dayOfWeek === 0) dayOfWeek = 7; // Sun = 7

    // Check exceptions first
    const exception = avail.exceptions.find((e) => e.date === this.currentDate());
    if (exception) {
      if (exception.isUnavailableAllDay) return false;
      if (exception.slots.length > 0) {
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        // Time is unavailable if it falls within any exception slot
        const inExcSlot = exception.slots.some((s) => timeStr >= s.startTime && timeStr < s.endTime);
        if (inExcSlot) return false;
      }
    }

    // Check regular availability
    const slot = avail.slots.find((s) => s.dayOfWeek === dayOfWeek);
    if (!slot) return false; // No slot for this day = unavailable

    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    return timeStr >= slot.startTime && timeStr < slot.endTime;
  }

  /** Get unavailable time blocks for a professional on the current date (for overlay rendering) */
  getUnavailableBlocks(professionalId: string): { topPx: number; heightPx: number }[] {
    const avail = this.profAvailabilities().find((a) => a.profId === professionalId);
    if (!avail) return [];

    const parts = this.currentDate().split('-');
    const dayDate = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    let dayOfWeek = dayDate.getDay();
    if (dayOfWeek === 0) dayOfWeek = 7;

    // Check for exception
    const exception = avail.exceptions.find((e) => e.date === this.currentDate());
    if (exception?.isUnavailableAllDay) {
      // Entire day unavailable
      return [{ topPx: 0, heightPx: this.calendarHeight }];
    }

    // If the exception has specific unavailable slots, overlay those on top of regular availability
    const slot = avail.slots.find((s) => s.dayOfWeek === dayOfWeek);
    if (!slot) {
      // No availability for this day → entire day unavailable
      return [{ topPx: 0, heightPx: this.calendarHeight }];
    }

    const blocks: { topPx: number; heightPx: number }[] = [];
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
      blocks.push({ topPx, heightPx });
    }

    // Block after available time
    if (endMin < calEndMin) {
      const topPx = ((endMin - calStartMin) / 60) * SLOT_HEIGHT;
      const heightPx = ((calEndMin - endMin) / 60) * SLOT_HEIGHT;
      blocks.push({ topPx, heightPx });
    }

    // Add exception slot blocks (unavailable ranges within the working day)
    if (exception && exception.slots.length > 0) {
      for (const excSlot of exception.slots) {
        const excStartMin = toMinutes(excSlot.startTime);
        const excEndMin = toMinutes(excSlot.endTime);
        const topPx = ((Math.max(excStartMin, calStartMin) - calStartMin) / 60) * SLOT_HEIGHT;
        const bottomPx = ((Math.min(excEndMin, calEndMin) - calStartMin) / 60) * SLOT_HEIGHT;
        if (bottomPx > topPx) {
          blocks.push({ topPx, heightPx: bottomPx - topPx });
        }
      }
    }

    return blocks;
  }

  appointmentsForProfessional(professionalId: string): AppointmentResponse[] {
    const d = this.currentDate();
    return this.allAppointments()
      .filter((a) => a.professionalId === professionalId && a.startDatetime.startsWith(d))
      .sort((a, b) => a.startDatetime.localeCompare(b.startDatetime));
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
    return (durationMinutes / 60) * SLOT_HEIGHT;
  }

  aptBg(apt: AppointmentResponse): string {
    const hex = apt.serviceTypeColor;
    if (!hex) return '#F3F4F6';
    return hex + '20';
  }

  aptBorder(apt: AppointmentResponse): string {
    return apt.serviceTypeColor || '#9CA3AF';
  }

  statusBg(status: AppointmentStatus): string {
    const map: Record<string, string> = { REQUESTED: '#FEF3C7', CONFIRMED: '#D1FAE5', PROPOSED_NEW_TIME: '#DBEAFE', CANCELLED: '#FEE2E2', COMPLETED: '#F3F4F6', NO_SHOW: '#EDE9FE' };
    return map[status] ?? '#F3F4F6';
  }

  statusTextColor(status: AppointmentStatus): string {
    const map: Record<string, string> = { REQUESTED: '#92400E', CONFIRMED: '#065F46', PROPOSED_NEW_TIME: '#1E40AF', CANCELLED: '#991B1B', COMPLETED: '#374151', NO_SHOW: '#5B21B6' };
    return map[status] ?? '#374151';
  }

  private shiftDate(days: number): void {
    const parts = this.currentDate().split('-');
    const d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    d.setDate(d.getDate() + days);
    this.currentDate.set(this.toDateStr(d));
    this.loadAppointments();
  }

  private loadAppointments(): void {
    this.isLoading.set(true);
    const bounds = this.getWeekBounds(this.currentDate());
    this.aptService.list(0, 1000, undefined, undefined, bounds.start, bounds.end).subscribe({
      next: (page) => {
        this.allAppointments.set(page.content);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
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

  statusLabel(status: AppointmentStatus): string {
    const map: Record<string, string> = { REQUESTED: 'Da confermare', CONFIRMED: 'Confermato', PROPOSED_NEW_TIME: 'Proposta', CANCELLED: 'Cancellato', COMPLETED: 'Completato', NO_SHOW: 'Non presentato' };
    return map[status] ?? status;
  }

  statusVariant(status: AppointmentStatus): 'amber' | 'green' | 'blue' | 'red' | 'gray' | 'purple' {
    const map: Record<string, 'amber' | 'green' | 'blue' | 'red' | 'gray' | 'purple'> = { REQUESTED: 'amber', CONFIRMED: 'green', PROPOSED_NEW_TIME: 'blue', CANCELLED: 'red', COMPLETED: 'gray', NO_SHOW: 'purple' };
    return map[status] ?? 'gray';
  }
}
