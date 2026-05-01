import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { AppointmentService } from '../../core/services/appointment.service';
import { ProfessionalService } from '../../core/services/professional.service';
import { ClientService } from '../../core/services/client.service';
import { ServiceTypeService } from '../../core/services/service-type.service';
import { StudioService } from '../../core/services/studio.service';
import { AuthService } from '../../core/services/auth.service';
import type {
  ProfessionalResponse,
  ClientSummaryResponse,
  ServiceTypeResponse,
  TimeSlotResponse,
  UUID,
} from '../../core/models/domain.model';
import { getErrorMessage } from '../../shared/utils/errors';

const MONTHS_IT = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
const DAYS_IT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  imports: [RouterLink, FormsModule, PageShellComponent, CardComponent, ButtonComponent, AlertComponent],
  template: `
    <app-page-shell>
      <div class="mx-auto max-w-2xl">
        <a routerLink="/appuntamenti" class="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Torna alla lista
        </a>

        <h2 class="mb-6 text-xl sm:text-2xl font-bold text-gray-900">Nuovo appuntamento</h2>

        @if (error()) {
          <app-alert variant="error" [message]="error()" class="mb-6" />
        }

        <div class="space-y-5">
          <!-- Step 1: Service -->
          <app-card>
            <h3 class="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">1. Servizio (opzionale)</h3>
            <input type="text" [ngModel]="serviceSearchText()" (ngModelChange)="onServiceSearch($event)" placeholder="Cerca servizio per nome..."
              class="mb-2 w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-colors" />
            @if (selectedServiceId()) {
              <div class="mb-2 flex items-center gap-2 rounded-lg border-2 border-indigo-600 bg-indigo-50 px-3 py-2 text-sm">
                @if (selectedServiceColor()) {
                  <span class="h-3 w-3 rounded-full shrink-0" [style.background-color]="selectedServiceColor()"></span>
                }
                <span class="font-medium text-indigo-700">{{ selectedServiceName() }}</span>
                <button (click)="selectNoService()" type="button" class="ml-auto text-gray-400 hover:text-gray-600">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            }
            <div class="max-h-52 overflow-y-auto space-y-1">
              <button (click)="selectNoService()" type="button"
                [class]="!selectedServiceId()
                  ? 'w-full rounded-lg border-2 border-indigo-600 bg-indigo-50 p-3 text-left text-sm transition-colors'
                  : 'w-full rounded-lg border border-gray-200 p-3 text-left text-sm hover:bg-gray-50 transition-colors'">
                <span class="font-medium text-gray-900">Nessun servizio</span>
                <span class="block text-xs text-gray-400">Durata personalizzata</span>
              </button>
              @for (svc of filteredServices(); track svc.id) {
                <button (click)="selectService(svc)" type="button"
                  [class]="selectedServiceId() === svc.id
                    ? 'w-full rounded-lg border-2 border-indigo-600 bg-indigo-50 p-3 text-left text-sm transition-colors'
                    : 'w-full rounded-lg border border-gray-200 p-3 text-left text-sm hover:bg-gray-50 transition-colors'">
                  <div class="flex items-center gap-2">
                    @if (svc.color) {
                      <span class="h-3 w-3 rounded-full shrink-0" [style.background-color]="svc.color"></span>
                    }
                    <span class="font-medium text-gray-900">{{ svc.name }}</span>
                  </div>
                  <span class="block text-xs text-gray-400">{{ svc.durationMinutes }} min {{ svc.price ? '· €' + svc.price : '' }}</span>
                </button>
              }
            </div>
          </app-card>

          <!-- Step 2: Professional -->
          <app-card>
            <h3 class="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">2. Professionista</h3>
            <input type="text" [ngModel]="professionalSearchText()" (ngModelChange)="onProfessionalSearch($event)" placeholder="Cerca professionista per nome o email..."
              class="mb-2 w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-colors" />
            @if (selectedProfessionalId()) {
              <div class="mb-2 flex items-center gap-2 rounded-lg border-2 border-indigo-600 bg-indigo-50 px-3 py-2 text-sm">
                <span class="font-medium text-indigo-700">{{ selectedProfessionalName() }}</span>
                <button (click)="clearProfessional()" type="button" class="ml-auto text-gray-400 hover:text-gray-600">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            }
            @if (searchedProfessionals().length === 0) {
              <p class="text-sm text-gray-400">Nessun professionista disponibile per il servizio selezionato.</p>
            } @else {
              <div class="max-h-52 overflow-y-auto space-y-1">
                @for (pro of searchedProfessionals(); track pro.id) {
                  <button (click)="selectProfessional(pro)" type="button"
                    [class]="selectedProfessionalId() === pro.id
                      ? 'w-full rounded-lg border-2 border-indigo-600 bg-indigo-50 p-3 text-left transition-colors'
                      : 'w-full rounded-lg border border-gray-200 p-3 text-left hover:bg-gray-50 transition-colors'">
                    <span class="font-medium text-gray-900">{{ pro.firstName }} {{ pro.lastName }}</span>
                    @if (pro.email) {
                      <span class="block text-xs text-gray-500">{{ pro.email }}</span>
                    }
                  </button>
                }
              </div>
            }
          </app-card>

          <!-- Step 3: Client -->
          <app-card>
            <h3 class="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">3. Cliente</h3>
            <input type="text" [(ngModel)]="clientSearch" (input)="searchClients()" placeholder="Cerca cliente per nome o email..."
              class="mb-3 w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-colors" />
            @if (clientResults().length > 0) {
              <div class="max-h-48 overflow-y-auto space-y-1 mb-3">
                @for (c of clientResults(); track c.id) {
                  <button (click)="selectedClientId.set(c.id); selectedClientName.set(c.firstName + ' ' + c.lastName); showNewClientForm.set(false)" type="button"
                    [class]="selectedClientId() === c.id
                      ? 'w-full rounded-lg border-2 border-indigo-600 bg-indigo-50 px-3 py-2 text-left text-sm transition-colors'
                      : 'w-full rounded-lg border border-gray-100 px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors'">
                    <span class="font-medium">{{ c.firstName }} {{ c.lastName }}</span>
                    @if (c.email) {
                      <span class="text-gray-400 ml-2">{{ c.email }}</span>
                    }
                  </button>
                }
              </div>
            }
            @if (selectedClientName()) {
              <div class="mb-3 flex items-center gap-2 rounded-lg border-2 border-indigo-600 bg-indigo-50 px-3 py-2 text-sm">
                <span class="font-medium text-indigo-700">{{ selectedClientName() }}</span>
                <button (click)="selectedClientId.set(null); selectedClientName.set('')" type="button" class="ml-auto text-gray-400 hover:text-gray-600">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            }
            @if (!showNewClientForm()) {
              <button (click)="showNewClientForm.set(true)" type="button"
                class="flex items-center gap-2 text-sm text-indigo-600 font-medium hover:text-indigo-700 transition-colors mt-1">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                Crea nuovo cliente
              </button>
            } @else {
              <div class="mt-3 rounded-lg border border-indigo-200 bg-indigo-50/30 p-4 space-y-3">
                <h4 class="text-sm font-semibold text-gray-800">Nuovo cliente</h4>
                <div class="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
                    <input type="text" [(ngModel)]="newClientFirstName"
                      class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-colors" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Cognome *</label>
                    <input type="text" [(ngModel)]="newClientLastName"
                      class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-colors" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Email</label>
                    <input type="email" [(ngModel)]="newClientEmail"
                      class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-colors" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Telefono</label>
                    <input type="tel" [(ngModel)]="newClientPhone"
                      class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-colors" />
                  </div>
                </div>
                <div class="flex items-center gap-2 pt-1">
                  <app-button [disabled]="!newClientFirstName.trim() || !newClientLastName.trim()" [isLoading]="creatingClient()" (click)="createNewClient()">
                    Crea e seleziona
                  </app-button>
                  <button (click)="showNewClientForm.set(false)" type="button" class="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                    Annulla
                  </button>
                </div>
              </div>
            }
          </app-card>

          <!-- Step 4: Date + Slots -->
          <app-card>
            <h3 class="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">4. Data e ora</h3>

            <!-- Calendar -->
            <div class="rounded-xl border border-gray-200 overflow-hidden mb-4">
              <div class="flex items-center justify-between bg-gray-50 px-4 py-3">
                <button (click)="calPrevMonth()" type="button" class="rounded-lg p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                </button>
                <span class="text-sm font-semibold text-gray-900">{{ calMonthLabel() }}</span>
                <button (click)="calNextMonth()" type="button" class="rounded-lg p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </button>
              </div>
              <div class="grid grid-cols-7 bg-gray-50 border-t border-gray-100">
                @for (day of daysOfWeek; track day) {
                  <div class="py-2 text-center text-[10px] sm:text-xs font-medium text-gray-400 uppercase">{{ day }}</div>
                }
              </div>
              <div class="grid grid-cols-7">
                @for (day of calDays(); track $index) {
                  @if (day) {
                    <button (click)="selectDate(day.dateStr)" type="button"
                      [disabled]="day.isPast"
                      [class]="getCalDayClass(day)"
                      class="relative py-2.5 sm:py-3 text-center text-sm transition-all duration-150">
                      {{ day.num }}
                      @if (day.isToday) {
                        <span class="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-indigo-500"></span>
                      }
                    </button>
                  } @else {
                    <div class="py-2.5 sm:py-3"></div>
                  }
                }
              </div>
            </div>

            @if (selectedDate()) {
              <div class="mb-4 text-sm text-gray-600">
                <span class="font-medium">{{ selectedDateLabel() }}</span>
              </div>
            }

            <!-- Slot picker -->
            @if (selectedDate() && selectedProfessionalId()) {
              <div class="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                <h4 class="text-sm font-semibold text-gray-700 mb-3">Orari disponibili</h4>

                @if (!selectedServiceId()) {
                  <div class="mb-4">
                    <label class="block text-xs font-medium text-gray-600 mb-1">Durata (min)</label>
                    <input type="number" [ngModel]="selectedDuration()" (ngModelChange)="setDuration($event)" min="5" step="5"
                      class="w-36 rounded-lg border border-gray-200 px-3 py-2.5 text-sm bg-white shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-colors" />
                  </div>
                }

                @if (loadingSlots()) {
                  <div class="flex items-center gap-2 py-3">
                    <div class="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600"></div>
                    <span class="text-xs text-gray-400">Carico orari disponibili...</span>
                  </div>
                } @else if (availableSlots().length === 0) {
                  <p class="text-sm text-gray-400 py-2">Nessun orario disponibile per questo giorno.</p>
                } @else {
                  <div class="flex flex-wrap gap-2">
                    @for (slot of availableSlots(); track slot.start) {
                      <button (click)="selectSlot(slot)" type="button"
                        [class]="selectedSlot()?.start === slot.start
                          ? 'rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm'
                          : 'rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 transition-colors'">
                        {{ formatSlotTime(slot.start) }}
                      </button>
                    }
                  </div>
                }
              </div>
            }
          </app-card>

          <!-- Step 5: Notes -->
          <app-card>
            <h3 class="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">5. Note (opzionale)</h3>
            <textarea [(ngModel)]="notes" rows="3" placeholder="Note sull'appuntamento..."
              class="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none resize-none transition-colors">
            </textarea>
          </app-card>

          <!-- Submit -->
          <div class="flex items-center justify-end gap-3 pb-6">
            <a routerLink="/appuntamenti">
              <app-button variant="secondary">Annulla</app-button>
            </a>
            <app-button [disabled]="!canSubmit()" [isLoading]="isSaving()" (click)="onSubmit()">
              Crea appuntamento
            </app-button>
          </div>
        </div>
      </div>
    </app-page-shell>
  `,
})
export class AppointmentFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly aptService = inject(AppointmentService);
  private readonly profService = inject(ProfessionalService);
  private readonly clientService = inject(ClientService);
  private readonly svcService = inject(ServiceTypeService);
  private readonly studioService = inject(StudioService);
  private readonly authService = inject(AuthService);

  readonly professionals = signal<ProfessionalResponse[]>([]);
  readonly services = signal<ServiceTypeResponse[]>([]);
  readonly clientResults = signal<ClientSummaryResponse[]>([]);
  readonly isSaving = signal(false);
  readonly error = signal('');
  readonly availableSlots = signal<TimeSlotResponse[]>([]);
  readonly loadingSlots = signal(false);
  readonly selectedSlot = signal<TimeSlotResponse | null>(null);

  readonly selectedProfessionalId = signal<UUID | null>(null);
  readonly selectedProfessionalName = signal('');
  readonly selectedClientId = signal<UUID | null>(null);
  readonly selectedClientName = signal('');
  readonly selectedServiceId = signal<UUID | null>(null);
  readonly selectedServiceName = signal('');
  readonly selectedServiceColor = signal<string | null>(null);
  readonly selectedDuration = signal(30);
  readonly serviceSearchText = signal('');
  readonly professionalSearchText = signal('');
  clientSearch = '';
  readonly selectedDate = signal('');
  notes = '';

  // New client inline form
  readonly showNewClientForm = signal(false);
  readonly creatingClient = signal(false);
  newClientFirstName = '';
  newClientLastName = '';
  newClientEmail = '';
  newClientPhone = '';

  // Calendar state
  readonly calMonth = signal(new Date().getMonth());
  readonly calYear = signal(new Date().getFullYear());
  readonly daysOfWeek = DAYS_IT;

  readonly calMonthLabel = computed(() => `${MONTHS_IT[this.calMonth()]} ${this.calYear()}`);

  readonly calDays = computed(() => {
    const year = this.calYear();
    const month = this.calMonth();
    const firstDay = new Date(year, month, 1);
    let dow = firstDay.getDay();
    if (dow === 0) dow = 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const cells: (null | { num: number; dateStr: string; isToday: boolean; isPast: boolean; isSelected: boolean })[] = [];
    for (let i = 1; i < dow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayDate = new Date(year, month, d);
      const isPast = dayDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      cells.push({ num: d, dateStr, isToday: dateStr === todayStr, isPast, isSelected: dateStr === this.selectedDate() });
    }
    return cells;
  });

  readonly selectedDateLabel = computed(() => {
    const sd = this.selectedDate();
    if (!sd) return '';
    const parts = sd.split('-');
    const d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    return d.toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  });

  readonly studioTimezone = computed(() => this.studioService.studio()?.timezone ?? 'Europe/Rome');

  readonly filteredServices = computed(() => {
    const q = this.serviceSearchText().toLowerCase().trim();
    const all = this.services();
    if (!q) return all;
    return all.filter((s) => s.name.toLowerCase().includes(q));
  });

  readonly filteredProfessionals = computed(() => {
    const svcId = this.selectedServiceId();
    const allPros = this.professionals();
    if (!svcId) return allPros;
    const svc = this.services().find((s) => s.id === svcId);
    if (!svc || svc.professionalIds.length === 0) return allPros;
    return allPros.filter((p) => svc.professionalIds.includes(p.id));
  });

  readonly searchedProfessionals = computed(() => {
    const q = this.professionalSearchText().toLowerCase().trim();
    const filtered = this.filteredProfessionals();
    if (!q) return filtered;
    return filtered.filter((p) =>
      (p.firstName + ' ' + p.lastName).toLowerCase().includes(q) ||
      (p.email ?? '').toLowerCase().includes(q)
    );
  });

  readonly canSubmit = computed(() =>
    !!this.selectedProfessionalId() && !!this.selectedClientId() && !!this.selectedDate() && !!this.selectedSlot()
  );

  private searchTimeout?: ReturnType<typeof setTimeout>;
  private loadSlotTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    const user = this.authService.user();
    if (user) {
      this.studioService.getMyStudio(user.studioId).subscribe();
    }
    this.profService.list().subscribe({
      next: (list) => {
        this.professionals.set(list.filter((p) => p.active));
        this.applyQueryParams();
      },
    });
    this.svcService.list().subscribe({ next: (list) => this.services.set(list.filter((s) => s.active)) });
  }

  private applyQueryParams(): void {
    const params = this.route.snapshot.queryParamMap;
    const date = params.get('date');
    const profId = params.get('professionalId');

    if (date) {
      this.selectedDate.set(date);
      const parts = date.split('-');
      this.calMonth.set(+parts[1] - 1);
      this.calYear.set(+parts[0]);
    }

    if (profId) {
      const pro = this.professionals().find((p) => p.id === profId);
      if (pro) this.selectProfessional(pro);
    }

    if (date && profId) {
      this.loadAvailableSlots();
    }
  }

  searchClients(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      if (this.clientSearch.trim().length < 2) {
        this.clientResults.set([]);
        return;
      }
      this.clientService.list(this.clientSearch, 0, 10).subscribe({
        next: (page) => this.clientResults.set(page.content),
      });
    }, 300);
  }

  onServiceSearch(value: string): void { this.serviceSearchText.set(value); }
  onProfessionalSearch(value: string): void { this.professionalSearchText.set(value); }

  selectProfessional(pro: ProfessionalResponse): void {
    this.selectedProfessionalId.set(pro.id);
    this.selectedProfessionalName.set(pro.firstName + ' ' + pro.lastName);
    this.selectedSlot.set(null);
    if (this.selectedDate()) this.loadAvailableSlots();
  }

  clearProfessional(): void {
    this.selectedProfessionalId.set(null);
    this.selectedProfessionalName.set('');
    this.selectedSlot.set(null);
    this.availableSlots.set([]);
  }

  selectService(svc: ServiceTypeResponse): void {
    this.selectedServiceId.set(svc.id);
    this.selectedServiceName.set(svc.name);
    this.selectedServiceColor.set(svc.color ?? null);
    this.selectedDuration.set(svc.durationMinutes);
    this.resetProfessionalIfNeeded();
    this.selectedSlot.set(null);
    if (this.selectedDate() && this.selectedProfessionalId()) this.loadAvailableSlots();
  }

  selectNoService(): void {
    this.selectedServiceId.set(null);
    this.selectedServiceName.set('');
    this.selectedServiceColor.set(null);
    this.selectedDuration.set(30);
    this.resetProfessionalIfNeeded();
    this.selectedSlot.set(null);
    if (this.selectedDate() && this.selectedProfessionalId()) this.loadAvailableSlots();
  }

  private resetProfessionalIfNeeded(): void {
    const profId = this.selectedProfessionalId();
    if (profId && !this.filteredProfessionals().find((p) => p.id === profId)) {
      this.selectedProfessionalId.set(null);
    }
  }

  // Calendar navigation
  calPrevMonth(): void {
    if (this.calMonth() === 0) { this.calMonth.set(11); this.calYear.update((y) => y - 1); }
    else { this.calMonth.update((m) => m - 1); }
  }
  calNextMonth(): void {
    if (this.calMonth() === 11) { this.calMonth.set(0); this.calYear.update((y) => y + 1); }
    else { this.calMonth.update((m) => m + 1); }
  }

  selectDate(dateStr: string): void {
    this.selectedDate.set(dateStr);
    this.selectedSlot.set(null);
    if (this.selectedProfessionalId()) this.loadAvailableSlots();
  }

  setDuration(val: number): void {
    this.selectedDuration.set(val);
    this.selectedSlot.set(null);
    if (this.selectedDate() && this.selectedProfessionalId()) this.loadAvailableSlots();
  }

  getCalDayClass(day: { isSelected: boolean; isPast: boolean; isToday: boolean }): string {
    if (day.isSelected) return 'bg-indigo-600 text-white font-semibold rounded-lg shadow-sm';
    if (day.isPast) return 'text-gray-300 cursor-not-allowed';
    if (day.isToday) return 'text-indigo-700 font-bold hover:bg-indigo-50 rounded-lg';
    return 'text-gray-700 hover:bg-gray-100 rounded-lg';
  }

  private loadAvailableSlots(): void {
    const profId = this.selectedProfessionalId();
    const date = this.selectedDate();
    const duration = this.selectedDuration();
    if (!profId || !date || duration < 5) return;
    clearTimeout(this.loadSlotTimeout);
    this.loadSlotTimeout = setTimeout(() => {
      this.availableSlots.set([]);
      this.loadingSlots.set(true);
      this.profService.getAvailableSlots(profId, date, duration).subscribe({
        next: (slots) => { this.availableSlots.set(slots); this.loadingSlots.set(false); },
        error: () => this.loadingSlots.set(false),
      });
    }, 300);
  }

  selectSlot(slot: TimeSlotResponse): void {
    this.selectedSlot.set(slot);
  }

  formatSlotTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: this.studioTimezone(),
    });
  }

  // Inline client creation
  createNewClient(): void {
    if (!this.newClientFirstName.trim() || !this.newClientLastName.trim()) return;
    this.creatingClient.set(true);
    this.clientService.create({
      firstName: this.newClientFirstName.trim(),
      lastName: this.newClientLastName.trim(),
      email: this.newClientEmail.trim() || undefined,
      phone: this.newClientPhone.trim() || undefined,
    }).subscribe({
      next: (client) => {
        this.selectedClientId.set(client.id);
        this.selectedClientName.set(client.firstName + ' ' + client.lastName);
        this.showNewClientForm.set(false);
        this.creatingClient.set(false);
        this.newClientFirstName = '';
        this.newClientLastName = '';
        this.newClientEmail = '';
        this.newClientPhone = '';
      },
      error: (err) => {
        this.creatingClient.set(false);
        this.error.set(getErrorMessage(err));
      },
    });
  }

  onSubmit(): void {
    const profId = this.selectedProfessionalId();
    const clientId = this.selectedClientId();
    const slot = this.selectedSlot();
    if (!profId || !clientId || !slot) return;

    this.isSaving.set(true);
    this.error.set('');
    this.aptService.create({
      professionalId: profId,
      clientId: clientId,
      serviceTypeId: this.selectedServiceId() ?? undefined,
      startDatetime: slot.start,
      endDatetime: slot.end,
      notes: this.notes.trim() || undefined,
      confirmImmediately: true,
    }).subscribe({
      next: (a) => this.router.navigate(['/appuntamenti', a.id]),
      error: (err) => {
        this.isSaving.set(false);
        this.error.set(getErrorMessage(err));
      },
    });
  }
}
