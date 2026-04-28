import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProfessionalPortalService } from '../../core/services/professional-portal.service';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import type { AppointmentResponse, AppointmentStatus, ClientSummaryResponse, CreateAppointmentRequest, CreateClientRequest, ServiceTypeResponse, UUID } from '../../core/models/domain.model';
import { AuthService } from '../../core/services/auth.service';
import { FormsModule } from '@angular/forms';

const HOUR_START = 7;
const HOUR_END = 21;
const SLOT_HEIGHT = 60;

@Component({
  selector: 'app-professional-appointments',
  standalone: true,
  imports: [PageShellComponent, CardComponent, BadgeComponent, ButtonComponent, FormsModule],
  template: `
    <app-page-shell>
      <div class="mx-auto max-w-5xl">
        <!-- Header -->
        <div class="mb-6 flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">Appuntamenti</h2>
            <p class="text-sm text-gray-500">Gestisci i tuoi appuntamenti</p>
          </div>
          <div class="flex items-center gap-3">
            <app-button (click)="openNewAppointment()">+ Nuovo</app-button>
            <!-- View toggle -->
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
        </div>

        <!-- Day nav (calendar mode) -->
        @if (viewMode() === 'calendar') {
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
          <!-- Week quick-nav -->
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
        }

        <!-- Status filter (list mode) -->
        @if (viewMode() === 'list') {
          <div class="mb-4 flex flex-wrap items-center gap-3">
            @for (f of statusFilters; track f.value) {
              <button (click)="onFilterChange(f.value)"
                [class]="statusFilter() === f.value
                  ? 'rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white'
                  : 'rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors'">
                {{ f.label }}
              </button>
            }
          </div>
        }

        @if (isLoading()) {
          <div class="flex justify-center py-12">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
          </div>
        } @else {

          <!-- ── CALENDAR VIEW ── -->
          @if (viewMode() === 'calendar') {
            @if (dayAppointments().length === 0) {
              <app-card extraClass="text-center py-12">
                <svg class="mx-auto h-10 w-10 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <p class="text-sm text-gray-400">Nessun appuntamento per questa giornata</p>
              </app-card>
            } @else {
              <div class="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <!-- calendar body: time labels + single column -->
                <div class="relative grid" style="grid-template-columns: 56px 1fr;" [style.height.px]="calendarHeight">
                  <!-- Hour labels -->
                  <div class="border-r border-gray-100">
                    @for (h of hours; track h) {
                      <div class="absolute pr-2 text-right text-[10px] text-gray-400 w-[56px]"
                           [style.top.px]="(h - hourStart) * slotHeight"
                           style="line-height: 0; transform: translateY(-6px);">
                        {{ h }}:00
                      </div>
                    }
                  </div>
                  <!-- Appointments column -->
                  <div class="relative">
                    @for (h of hours; track h) {
                      <div class="absolute inset-x-0 border-t border-gray-100" [style.top.px]="(h - hourStart) * slotHeight"></div>
                    }
                    @for (apt of dayAppointments(); track apt.id) {
                      <div class="absolute inset-x-1 rounded-lg px-2 py-1 text-xs overflow-hidden border-l-4 cursor-pointer hover:opacity-90 transition-opacity"
                           [style.top.px]="calendarTop(apt)"
                           [style.height.px]="calendarBlockHeight(apt)"
                           [style.min-height.px]="28"
                           [style.background-color]="aptBg(apt)"
                           [style.border-left-color]="aptBorder(apt)">
                        <div class="font-semibold truncate text-gray-900">
                          {{ formatTime(apt.startDatetime) }} — {{ apt.clientFullName }}
                        </div>
                        @if (calendarBlockHeight(apt) > 32 && apt.serviceTypeName) {
                          <div class="truncate text-gray-600 text-[10px]">{{ apt.serviceTypeName }}</div>
                        }
                        @if (calendarBlockHeight(apt) > 52) {
                          <div class="mt-1 flex items-center gap-2">
                            @if (apt.status === 'REQUESTED') {
                              <button (click)="doAction(apt.id, 'confirm'); $event.stopPropagation()"
                                class="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 hover:bg-green-200 transition-colors">
                                Conferma
                              </button>
                              <button (click)="doAction(apt.id, 'cancel'); $event.stopPropagation()"
                                class="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700 hover:bg-red-200 transition-colors">
                                Cancella
                              </button>
                            } @else if (apt.status === 'CONFIRMED') {
                              <button (click)="doAction(apt.id, 'complete'); $event.stopPropagation()"
                                class="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-700 hover:bg-gray-200 transition-colors">
                                Completa
                              </button>
                              <button (click)="doAction(apt.id, 'no-show'); $event.stopPropagation()"
                                class="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 hover:bg-purple-200 transition-colors">
                                No-show
                              </button>
                            }
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>
              </div>
            }
          }

          <!-- ── LIST VIEW ── -->
          @if (viewMode() === 'list') {
            @if (appointments().length === 0) {
              <app-card extraClass="text-center py-12">
                <svg class="mx-auto h-10 w-10 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <p class="text-sm text-gray-400">Nessun appuntamento trovato</p>
              </app-card>
            } @else {
              <app-card>
                <div class="-mx-4 -my-4 sm:-mx-6 sm:-my-6">
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                      <tr>
                        <th class="py-3 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 sm:pl-6">Data e Ora</th>
                        <th class="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Cliente</th>
                        <th class="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Stato</th>
                        <th class="px-3 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500 sm:pr-6">Azioni</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 bg-white">
                      @for (apt of appointments(); track apt.id) {
                        <tr class="hover:bg-gray-50 transition-colors">
                          <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                            <div class="font-medium text-gray-900">{{ formatDate(apt.startDatetime) }}</div>
                            <div class="text-gray-500">{{ formatTime(apt.startDatetime) }} – {{ formatTime(apt.endDatetime) }}</div>
                          </td>
                          <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                            <div>{{ apt.clientFullName }}</div>
                            @if (apt.serviceTypeName) {
                              <div class="text-xs mt-0.5 text-gray-400">{{ apt.serviceTypeName }}</div>
                            }
                          </td>
                          <td class="whitespace-nowrap px-3 py-4 text-sm">
                            <app-badge [variant]="statusVariant(apt.status)">{{ statusLabel(apt.status) }}</app-badge>
                          </td>
                          <td class="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm sm:pr-6">
                            @if (apt.status === 'REQUESTED') {
                              <div class="flex items-center justify-end gap-2">
                                <button (click)="doAction(apt.id, 'confirm')" class="text-green-600 hover:text-green-800 font-medium transition-colors">Conferma</button>
                                <button (click)="doAction(apt.id, 'cancel')" class="text-red-600 hover:text-red-800 font-medium transition-colors">Cancella</button>
                              </div>
                            } @else if (apt.status === 'CONFIRMED') {
                              <div class="flex items-center justify-end gap-2">
                                <button (click)="doAction(apt.id, 'complete')" class="text-gray-600 hover:text-gray-800 font-medium transition-colors">Completa</button>
                                <button (click)="doAction(apt.id, 'no-show')" class="text-purple-600 hover:text-purple-800 font-medium transition-colors">No-show</button>
                              </div>
                            } @else {
                              <span class="text-gray-300">—</span>
                            }
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </app-card>
            }
          }
        }
      </div>

      <!-- ── NEW APPOINTMENT SLIDE-OVER ── -->
      @if (showNewPanel()) {
        <div class="fixed inset-0 z-50 flex justify-end">
          <div class="absolute inset-0 bg-black/30" (click)="closeNewAppointment()"></div>
          <div class="relative w-full max-w-md bg-white shadow-xl overflow-y-auto">
            <div class="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
              <h3 class="text-lg font-semibold text-gray-900">Nuovo appuntamento</h3>
              <button (click)="closeNewAppointment()" class="text-gray-400 hover:text-gray-600 transition-colors">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div class="p-6 space-y-5">
              <!-- Client selector -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                @if (!showQuickClient()) {
                  <select [(ngModel)]="newApt.clientId" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none">
                    <option value="">Seleziona cliente...</option>
                    @for (c of clients(); track c.id) {
                      <option [value]="c.id">{{ c.firstName }} {{ c.lastName }}{{ c.email ? ' — ' + c.email : '' }}</option>
                    }
                  </select>
                  <button (click)="showQuickClient.set(true)" class="mt-2 text-sm text-indigo-600 hover:text-indigo-500 font-medium transition-colors">
                    + Crea nuovo cliente
                  </button>
                } @else {
                  <!-- Quick create client inline -->
                  <div class="rounded-lg border border-indigo-200 bg-indigo-50/50 p-4 space-y-3">
                    <p class="text-xs font-semibold uppercase tracking-wider text-indigo-500">Nuovo cliente</p>
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs text-gray-500 mb-1">Nome *</label>
                        <input type="text" [(ngModel)]="quickClient.firstName" class="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                      </div>
                      <div>
                        <label class="block text-xs text-gray-500 mb-1">Cognome *</label>
                        <input type="text" [(ngModel)]="quickClient.lastName" class="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                      </div>
                    </div>
                    <div>
                      <label class="block text-xs text-gray-500 mb-1">Email</label>
                      <input type="email" [(ngModel)]="quickClient.email" class="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                    </div>
                    <div>
                      <label class="block text-xs text-gray-500 mb-1">Telefono</label>
                      <input type="tel" [(ngModel)]="quickClient.phone" class="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                    </div>
                    <div class="flex items-center gap-2">
                      <app-button size="sm" [isLoading]="creatingClient()" [disabled]="!quickClient.firstName || !quickClient.lastName" (click)="createQuickClient()">Crea e seleziona</app-button>
                      <button (click)="cancelQuickClient()" class="text-sm text-gray-500 hover:text-gray-700 transition-colors">Annulla</button>
                    </div>
                  </div>
                }
              </div>

              <!-- Service type -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tipo di servizio</label>
                <select [(ngModel)]="newApt.serviceTypeId" (ngModelChange)="onServiceTypeChange()" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none">
                  <option value="">Nessuno (generico)</option>
                  @for (st of serviceTypes(); track st.id) {
                    <option [value]="st.id">{{ st.name }} ({{ st.durationMinutes }} min)</option>
                  }
                </select>
              </div>

              <!-- Date -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Data</label>
                <input type="date" [(ngModel)]="newApt.date" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
              </div>

              <!-- Time -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Ora inizio</label>
                  <input type="time" [(ngModel)]="newApt.startTime" (ngModelChange)="autoCalcEnd()" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Ora fine</label>
                  <input type="time" [(ngModel)]="newApt.endTime" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                </div>
              </div>

              <!-- Notes -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <textarea [(ngModel)]="newApt.notes" rows="2" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" placeholder="Note opzionali..."></textarea>
              </div>

              <!-- Confirm immediately -->
              <label class="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" [(ngModel)]="newApt.confirmImmediately" class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                Conferma immediatamente
              </label>

              @if (createError()) {
                <div class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{{ createError() }}</div>
              }

              <!-- Actions -->
              <div class="flex items-center gap-3 pt-2">
                <app-button [isLoading]="creatingApt()" [disabled]="!canCreateAppointment()" (click)="createAppointment()">Crea appuntamento</app-button>
                <button (click)="closeNewAppointment()" class="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors">Annulla</button>
              </div>
            </div>
          </div>
        </div>
      }
    </app-page-shell>
  `,
})
export class ProfessionalAppointmentsComponent implements OnInit {
  private readonly portalService = inject(ProfessionalPortalService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly viewMode = signal<'list' | 'calendar'>('calendar');
  readonly isLoading = signal(true);
  private readonly _all = signal<AppointmentResponse[]>([]);
  readonly statusFilter = signal<string>('');
  readonly currentDate = signal(this.toDateStr(new Date()));

  readonly hourStart = HOUR_START;
  readonly slotHeight = SLOT_HEIGHT;
  readonly hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
  readonly calendarHeight = (HOUR_END - HOUR_START) * SLOT_HEIGHT;

  // ── New appointment panel state ──
  readonly showNewPanel = signal(false);
  readonly showQuickClient = signal(false);
  readonly creatingClient = signal(false);
  readonly creatingApt = signal(false);
  readonly createError = signal('');
  readonly clients = signal<ClientSummaryResponse[]>([]);
  readonly serviceTypes = signal<ServiceTypeResponse[]>([]);

  newApt = this.freshAppointment();
  quickClient = { firstName: '', lastName: '', email: '', phone: '' };

  readonly canCreateAppointment = computed(() =>
    !!this.newApt.clientId && !!this.newApt.date && !!this.newApt.startTime && !!this.newApt.endTime
  );

  readonly statusFilters = [
    { value: '', label: 'Tutti' },
    { value: 'REQUESTED', label: 'Da confermare' },
    { value: 'CONFIRMED', label: 'Confermati' },
    { value: 'COMPLETED', label: 'Completati' },
    { value: 'CANCELLED', label: 'Cancellati' },
  ];

  readonly appointments = computed(() => {
    const f = this.statusFilter();
    return f ? this._all().filter((a) => a.status === f) : this._all();
  });

  readonly dayAppointments = computed(() => {
    const d = this.currentDate();
    return this._all()
      .filter((a) => a.startDatetime.startsWith(d))
      .sort((a, b) => a.startDatetime.localeCompare(b.startDatetime));
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
      return { date: this.toDateStr(d), dayLabel: d.toLocaleDateString('it-IT', { weekday: 'short' }), dayNum: d.getDate() };
    });
  });

  ngOnInit(): void {
    this.statusFilter.set(this.route.snapshot.queryParamMap.get('status') || '');
    this.loadData();
  }

  onFilterChange(v: string): void {
    this.statusFilter.set(v);
  }

  prevDay(): void { this.shiftDate(-1); }
  nextDay(): void { this.shiftDate(1); }

  goToDate(date: string): void { this.currentDate.set(date); }

  loadData(): void {
    this.isLoading.set(true);
    this.portalService.listAppointments(0, 200).subscribe({
      next: (page) => { this._all.set(page.content); this.isLoading.set(false); },
      error: () => this.isLoading.set(false),
    });
  }

  doAction(id: string, type: 'confirm' | 'cancel' | 'complete' | 'no-show'): void {
    const req =
      type === 'confirm' ? this.portalService.confirmAppointment(id) :
      type === 'cancel'  ? this.portalService.cancelAppointment(id) :
      type === 'complete' ? this.portalService.completeAppointment(id) :
      this.portalService.noShowAppointment(id);

    req.subscribe({ next: (updated) => this._all.update((list) => list.map((a) => a.id === updated.id ? updated : a)) });
  }

  calendarTop(apt: AppointmentResponse): number {
    const d = new Date(apt.startDatetime);
    return ((d.getHours() - HOUR_START) * 60 + d.getMinutes()) / 60 * SLOT_HEIGHT;
  }

  calendarBlockHeight(apt: AppointmentResponse): number {
    const mins = (new Date(apt.endDatetime).getTime() - new Date(apt.startDatetime).getTime()) / 60000;
    return (mins / 60) * SLOT_HEIGHT;
  }

  aptBg(apt: AppointmentResponse): string {
    return apt.serviceTypeColor ? apt.serviceTypeColor + '22' : '#F3F4F6';
  }

  aptBorder(apt: AppointmentResponse): string {
    return apt.serviceTypeColor || '#9CA3AF';
  }

  statusLabel(status: AppointmentStatus): string {
    const map: Record<string, string> = { REQUESTED: 'Da confermare', CONFIRMED: 'Confermato', PROPOSED_NEW_TIME: 'Proposta', CANCELLED: 'Cancellato', COMPLETED: 'Completato', NO_SHOW: 'Non presentato' };
    return map[status] ?? status;
  }

  statusVariant(status: AppointmentStatus): 'amber' | 'green' | 'blue' | 'red' | 'gray' | 'purple' {
    const map: Record<string, 'amber' | 'green' | 'blue' | 'red' | 'gray' | 'purple'> = { REQUESTED: 'amber', CONFIRMED: 'green', PROPOSED_NEW_TIME: 'blue', CANCELLED: 'red', COMPLETED: 'gray', NO_SHOW: 'purple' };
    return map[status] ?? 'gray';
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' });
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  }

  // ── New Appointment Panel ──

  openNewAppointment(): void {
    this.showNewPanel.set(true);
    this.createError.set('');
    this.newApt = this.freshAppointment();
    this.portalService.listClients().subscribe({ next: (c) => this.clients.set(c) });
    this.portalService.listServiceTypes().subscribe({ next: (s) => this.serviceTypes.set(s) });
  }

  closeNewAppointment(): void {
    this.showNewPanel.set(false);
    this.showQuickClient.set(false);
  }

  createQuickClient(): void {
    this.creatingClient.set(true);
    const req: CreateClientRequest = {
      firstName: this.quickClient.firstName.trim(),
      lastName: this.quickClient.lastName.trim(),
      email: this.quickClient.email.trim() || undefined,
      phone: this.quickClient.phone.trim() || undefined,
    };
    this.portalService.createClient(req).subscribe({
      next: (client) => {
        this.clients.update((list) => [...list, client]);
        this.newApt.clientId = client.id;
        this.quickClient = { firstName: '', lastName: '', email: '', phone: '' };
        this.showQuickClient.set(false);
        this.creatingClient.set(false);
      },
      error: () => this.creatingClient.set(false),
    });
  }

  cancelQuickClient(): void {
    this.showQuickClient.set(false);
    this.quickClient = { firstName: '', lastName: '', email: '', phone: '' };
  }

  onServiceTypeChange(): void {
    const st = this.serviceTypes().find((s) => s.id === this.newApt.serviceTypeId);
    if (st && this.newApt.startTime) { this.autoCalcEnd(st.durationMinutes); }
  }

  autoCalcEnd(durationMinutes?: number): void {
    if (!this.newApt.startTime) return;
    const mins = durationMinutes ?? this.serviceTypes().find((s) => s.id === this.newApt.serviceTypeId)?.durationMinutes;
    if (!mins) return;
    const [h, m] = this.newApt.startTime.split(':').map(Number);
    const end = new Date(2000, 0, 1, h, m + mins);
    this.newApt.endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
  }

  createAppointment(): void {
    this.creatingApt.set(true);
    this.createError.set('');
    const profId = this.authService.user()?.professionalId;
    if (!profId) { this.createError.set('ID professionista non trovato'); this.creatingApt.set(false); return; }

    const startIso = new Date(`${this.newApt.date}T${this.newApt.startTime}:00`).toISOString();
    const endIso = new Date(`${this.newApt.date}T${this.newApt.endTime}:00`).toISOString();

    const req: CreateAppointmentRequest = {
      professionalId: profId as UUID,
      clientId: this.newApt.clientId as UUID,
      serviceTypeId: this.newApt.serviceTypeId ? this.newApt.serviceTypeId as UUID : undefined,
      startDatetime: startIso,
      endDatetime: endIso,
      notes: this.newApt.notes || undefined,
      confirmImmediately: this.newApt.confirmImmediately,
    };

    this.portalService.createAppointment(req).subscribe({
      next: () => {
        this.creatingApt.set(false);
        this.closeNewAppointment();
        this.loadData();
      },
      error: (err) => {
        this.creatingApt.set(false);
        this.createError.set(err?.error?.message || 'Errore nella creazione');
      },
    });
  }

  private freshAppointment() {
    return { clientId: '', serviceTypeId: '', date: this.toDateStr(new Date()), startTime: '', endTime: '', notes: '', confirmImmediately: true };
  }

  private shiftDate(days: number): void {
    const d = new Date(this.currentDate() + 'T00:00:00');
    d.setDate(d.getDate() + days);
    this.currentDate.set(this.toDateStr(d));
  }

  private toDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
