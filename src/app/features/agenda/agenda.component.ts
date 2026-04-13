import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { AppointmentService } from '../../core/services/appointment.service';
import { ProfessionalService } from '../../core/services/professional.service';
import { ServiceTypeService } from '../../core/services/service-type.service';
import type { AppointmentResponse, AppointmentStatus, ProfessionalResponse, ServiceTypeResponse } from '../../core/models/domain.model';

const HOUR_START = 7;
const HOUR_END = 21;
const SLOT_HEIGHT = 60; // px per hour

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [RouterLink, PageShellComponent, CardComponent, ButtonComponent, BadgeComponent],
  template: `
    <app-page-shell>
      <div class="mx-auto" [class]="viewMode() === 'calendar' ? 'max-w-full' : 'max-w-4xl'">
        <div class="mb-6 flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">Agenda</h2>
            <p class="mt-1 text-sm text-gray-500">I tuoi appuntamenti</p>
          </div>
          <div class="flex gap-1 rounded-lg border border-gray-200 p-0.5">
            <button (click)="viewMode.set('list')"
              [class]="viewMode() === 'list'
                ? 'rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white'
                : 'rounded-md px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors'">
              Lista
            </button>
            <button (click)="viewMode.set('calendar')"
              [class]="viewMode() === 'calendar'
                ? 'rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white'
                : 'rounded-md px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors'">
              Calendario
            </button>
          </div>
        </div>

        <!-- Day navigation -->
        <div class="mb-4 flex items-center gap-4">
          <app-button variant="secondary" (click)="prevDay()">←</app-button>
          <div class="text-center flex-1">
            <h3 class="text-lg font-semibold text-gray-900">{{ dateLabel() }}</h3>
            @if (isToday()) {
              <span class="text-xs text-indigo-600 font-medium">Oggi</span>
            }
          </div>
          <app-button variant="secondary" (click)="nextDay()">→</app-button>
        </div>

        <!-- Week day quick nav -->
        <div class="mb-6 grid grid-cols-7 gap-1">
          @for (d of weekDays(); track d.date) {
            <button (click)="goToDate(d.date)"
              [class]="d.date === currentDate()
                ? 'rounded-lg bg-indigo-600 px-2 py-2 text-center text-white'
                : 'rounded-lg border border-gray-200 px-2 py-2 text-center text-gray-700 hover:bg-gray-50 transition-colors'">
              <div class="text-xs">{{ d.dayLabel }}</div>
              <div class="text-sm font-semibold">{{ d.dayNum }}</div>
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
                <a routerLink="/appuntamenti/nuovo">
                  <app-button variant="secondary">+ Nuovo appuntamento</app-button>
                </a>
              </app-card>
            } @else {
              <div class="space-y-3">
                @for (apt of dayAppointments(); track apt.id) {
                  <a [routerLink]="['/appuntamenti', apt.id]">
                    <app-card extraClass="hover:shadow-md transition-shadow !p-5">
                      <div class="flex items-center gap-4">
                        <div class="flex flex-col items-center rounded-lg bg-indigo-50 px-3 py-2 text-center shrink-0">
                          <span class="text-lg font-bold text-indigo-700">{{ formatTime(apt.startDatetime) }}</span>
                          <span class="text-xs text-indigo-500">{{ formatTime(apt.endDatetime) }}</span>
                        </div>
                        <div class="min-w-0 flex-1">
                          <div class="flex items-center gap-2">
                            <span class="font-semibold text-gray-900 truncate">{{ apt.clientFullName }}</span>
                            <app-badge [variant]="statusVariant(apt.status)">{{ statusLabel(apt.status) }}</app-badge>
                          </div>
                          <div class="mt-0.5 text-sm text-gray-500">
                            @if (apt.serviceTypeName) {
                              {{ apt.serviceTypeName }} ·
                            }
                            {{ apt.professionalFullName }}
                          </div>
                        </div>
                        <svg class="h-4 w-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                      </div>
                    </app-card>
                  </a>
                }
              </div>
            }
          }

          <!-- CALENDAR VIEW: columns = professionals, rows = time -->
          @if (viewMode() === 'calendar') {
            <!-- Service color legend -->
            @if (serviceTypes().length > 0) {
              <div class="mb-4 flex flex-wrap items-center gap-3">
                <span class="text-xs font-medium text-gray-400 uppercase tracking-wider">Servizi:</span>
                @for (svc of serviceTypes(); track svc.id) {
                  <div class="flex items-center gap-1.5">
                    <span class="h-3 w-3 rounded-full shrink-0" [style.background-color]="svc.color || '#D1D5DB'"></span>
                    <span class="text-xs text-gray-600">{{ svc.name }}</span>
                  </div>
                }
                <div class="flex items-center gap-1.5">
                  <span class="h-3 w-3 rounded-full shrink-0 bg-gray-300"></span>
                  <span class="text-xs text-gray-600">Altro</span>
                </div>
              </div>
            }

            @if (activeProfessionals().length === 0) {
              <app-card extraClass="text-center">
                <p class="text-gray-400">Nessun professionista attivo nello studio.</p>
              </app-card>
            } @else {
              <div class="rounded-xl border border-gray-200 bg-white overflow-x-auto">
                <!-- Calendar header: professional names -->
                <div class="grid border-b border-gray-200" [style.grid-template-columns]="calendarGridCols()">
                  <div class="border-r border-gray-100 bg-gray-50 min-w-[56px]"></div>
                  @for (pro of activeProfessionals(); track pro.id) {
                    <div class="border-r border-gray-100 px-3 py-3 text-center last:border-r-0 min-w-[140px]">
                      <div class="text-sm font-semibold text-gray-900 truncate">{{ pro.firstName }} {{ pro.lastName }}</div>
                      @if (pro.email) {
                        <div class="text-[10px] text-gray-400 truncate">{{ pro.email }}</div>
                      }
                    </div>
                  }
                </div>
                <!-- Calendar body -->
                <div class="relative grid" [style.grid-template-columns]="calendarGridCols()" [style.height.px]="calendarHeight">
                  <!-- Time labels -->
                  <div class="border-r border-gray-100 min-w-[56px]">
                    @for (h of hours; track h) {
                      <div class="absolute pr-2 text-right text-xs text-gray-400"
                        [style.top.px]="(h - hourStart) * slotHeight"
                        [style.width.px]="56"
                        [style.line-height.px]="0">
                        {{ h }}:00
                      </div>
                    }
                  </div>
                  <!-- Professional columns -->
                  @for (pro of activeProfessionals(); track pro.id) {
                    <div class="relative border-r border-gray-100 last:border-r-0 min-w-[140px]">
                      <!-- Hour grid lines -->
                      @for (h of hours; track h) {
                        <div class="absolute inset-x-0 border-t border-gray-100"
                          [style.top.px]="(h - hourStart) * slotHeight"></div>
                      }
                      <!-- Appointments for this professional -->
                      @for (apt of appointmentsForProfessional(pro.id); track apt.id) {
                        <a [routerLink]="['/appuntamenti', apt.id]"
                          class="absolute inset-x-0.5 mx-0.5 rounded-md px-1.5 py-0.5 text-xs overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border-l-3"
                          [style.top.px]="calendarTop(apt)"
                          [style.height.px]="calendarBlockHeight(apt)"
                          [style.min-height.px]="20"
                          [style.background-color]="aptBg(apt)"
                          [style.border-left-color]="aptBorder(apt)">
                          <div class="font-semibold truncate leading-tight text-gray-900">
                            {{ formatTime(apt.startDatetime) }} {{ apt.clientFullName }}
                          </div>
                          @if (calendarBlockHeight(apt) > 30) {
                            <div class="truncate text-[10px] leading-tight text-gray-600">
                              {{ apt.serviceTypeName || 'Nessun servizio' }}
                            </div>
                          }
                          @if (calendarBlockHeight(apt) > 44) {
                            <div class="mt-0.5">
                              <span class="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium"
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
  private readonly aptService = inject(AppointmentService);
  private readonly profService = inject(ProfessionalService);
  private readonly svcService = inject(ServiceTypeService);

  readonly viewMode = signal<'list' | 'calendar'>('calendar');
  readonly currentDate = signal(this.toDateStr(new Date()));
  readonly allAppointments = signal<AppointmentResponse[]>([]);
  readonly activeProfessionals = signal<ProfessionalResponse[]>([]);
  readonly serviceTypes = signal<ServiceTypeResponse[]>([]);
  readonly isLoading = signal(true);

  readonly hourStart = HOUR_START;
  readonly slotHeight = SLOT_HEIGHT;
  readonly hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
  readonly calendarHeight = (HOUR_END - HOUR_START) * SLOT_HEIGHT;

  readonly dayAppointments = computed(() => {
    const d = this.currentDate();
    return this.allAppointments()
      .filter((a) => a.startDatetime.startsWith(d))
      .sort((a, b) => a.startDatetime.localeCompare(b.startDatetime));
  });

  readonly calendarGridCols = computed(() => {
    const n = this.activeProfessionals().length;
    return `56px repeat(${n}, minmax(140px, 1fr))`;
  });

  readonly dateLabel = computed(() => {
    const d = new Date(this.currentDate() + 'T00:00:00');
    return d.toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  });

  readonly isToday = computed(() => this.currentDate() === this.toDateStr(new Date()));

  readonly weekDays = computed(() => {
    const cur = new Date(this.currentDate() + 'T00:00:00');
    const dow = cur.getDay() || 7;
    const monday = new Date(cur);
    monday.setDate(cur.getDate() - dow + 1);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return {
        date: this.toDateStr(d),
        dayLabel: d.toLocaleDateString('it-IT', { weekday: 'short' }),
        dayNum: d.getDate(),
      };
    });
  });

  ngOnInit(): void {
    this.profService.list().subscribe({ next: (list) => this.activeProfessionals.set(list.filter((p) => p.active)) });
    this.svcService.list().subscribe({ next: (list) => this.serviceTypes.set(list.filter((s) => s.active)) });
    this.loadAppointments();
  }

  prevDay(): void { this.shiftDate(-1); }
  nextDay(): void { this.shiftDate(1); }

  goToDate(date: string): void {
    this.currentDate.set(date);
    this.loadAppointments();
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

  /** Background color based on service type color, with a lighter tint */
  aptBg(apt: AppointmentResponse): string {
    const hex = apt.serviceTypeColor;
    if (!hex) return '#F3F4F6'; // gray-100 fallback
    return hex + '20'; // hex + 12% opacity
  }

  /** Left border color = full service color */
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
    const d = new Date(this.currentDate() + 'T00:00:00');
    d.setDate(d.getDate() + days);
    this.currentDate.set(this.toDateStr(d));
    this.loadAppointments();
  }

  private loadAppointments(): void {
    this.isLoading.set(true);
    this.aptService.list(0, 200).subscribe({
      next: (page) => {
        this.allAppointments.set(page.content);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  private toDateStr(d: Date): string {
    return d.toISOString().slice(0, 10);
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
