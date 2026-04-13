import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { AppointmentService } from '../../core/services/appointment.service';
import { ProfessionalService } from '../../core/services/professional.service';
import { ClientService } from '../../core/services/client.service';
import { ServiceTypeService } from '../../core/services/service-type.service';
import type {
  ProfessionalResponse,
  ClientSummaryResponse,
  ServiceTypeResponse,
  TimeSlotResponse,
  UUID,
} from '../../core/models/domain.model';
import { getErrorMessage } from '../../shared/utils/errors';

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

        <h2 class="mb-6 text-2xl font-bold text-gray-900">Nuovo appuntamento</h2>

        @if (error()) {
          <app-alert variant="error" [message]="error()" class="mb-6" />
        }

        <div class="space-y-6">
          <!-- Step 1: Service (optional, searchable) -->
          <app-card>
            <h3 class="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">1. Servizio (opzionale)</h3>
            <div class="relative">
              <input type="text" [ngModel]="serviceSearchText()" (ngModelChange)="onServiceSearch($event)" placeholder="Cerca servizio per nome..."
                class="mb-2 w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-colors" />
            </div>
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

          <!-- Step 2: Professional (searchable, filtered by service) -->
          <app-card>
            <h3 class="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">2. Professionista</h3>
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
            <h3 class="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">3. Cliente</h3>
            <input type="text" [(ngModel)]="clientSearch" (input)="searchClients()" placeholder="Cerca cliente per nome o email..."
              class="mb-3 w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-colors" />
            @if (clientResults().length > 0) {
              <div class="max-h-48 overflow-y-auto space-y-1">
                @for (c of clientResults(); track c.id) {
                  <button (click)="selectedClientId.set(c.id); selectedClientName.set(c.firstName + ' ' + c.lastName)" type="button"
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
              <div class="mt-2 text-sm text-indigo-600 font-medium">Selezionato: {{ selectedClientName() }}</div>
            }
          </app-card>

          <!-- Step 4: Date + Time -->
          <app-card>
            <h3 class="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">4. Data e ora</h3>
            <div class="flex flex-wrap items-end gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Data</label>
                <input type="date" [(ngModel)]="selectedDate" (change)="loadSlots()"
                  class="rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-colors" />
              </div>
              @if (!selectedServiceId()) {
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Durata (min)</label>
                  <input type="number" [(ngModel)]="selectedDuration" min="5" step="5" (change)="loadSlots()"
                    class="w-24 rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-colors" />
                </div>
              }
            </div>

            @if (slotsLoading()) {
              <div class="mt-4 flex justify-center">
                <div class="h-6 w-6 animate-spin rounded-full border-3 border-indigo-200 border-t-indigo-600"></div>
              </div>
            } @else if (slots().length > 0) {
              <div class="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                @for (slot of slots(); track slot.start) {
                  <button (click)="selectSlot(slot)" type="button"
                    [class]="selectedSlot()?.start === slot.start
                      ? 'rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white'
                      : 'rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:border-indigo-200 transition-colors'">
                    {{ formatSlotTime(slot.start) }}
                  </button>
                }
              </div>
            } @else if (selectedDate && selectedProfessionalId()) {
              <p class="mt-4 text-sm text-gray-400">Nessuno slot disponibile per questa data.</p>
            }
          </app-card>

          <!-- Step 5: Notes -->
          <app-card>
            <h3 class="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">5. Note (opzionale)</h3>
            <textarea [(ngModel)]="notes" rows="3" placeholder="Note sull'appuntamento..."
              class="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none resize-none transition-colors">
            </textarea>
          </app-card>

          <!-- Submit -->
          <div class="flex items-center justify-end gap-3">
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
  private readonly router = inject(Router);
  private readonly aptService = inject(AppointmentService);
  private readonly profService = inject(ProfessionalService);
  private readonly clientService = inject(ClientService);
  private readonly svcService = inject(ServiceTypeService);

  readonly professionals = signal<ProfessionalResponse[]>([]);
  readonly services = signal<ServiceTypeResponse[]>([]);
  readonly clientResults = signal<ClientSummaryResponse[]>([]);
  readonly slots = signal<TimeSlotResponse[]>([]);
  readonly slotsLoading = signal(false);
  readonly isSaving = signal(false);
  readonly error = signal('');

  readonly selectedProfessionalId = signal<UUID | null>(null);
  readonly selectedProfessionalName = signal('');
  readonly selectedClientId = signal<UUID | null>(null);
  readonly selectedClientName = signal('');
  readonly selectedServiceId = signal<UUID | null>(null);
  readonly selectedServiceName = signal('');
  readonly selectedServiceColor = signal<string | null>(null);
  readonly selectedSlot = signal<TimeSlotResponse | null>(null);
  readonly selectedDuration = signal(30);
  readonly serviceSearchText = signal('');
  readonly professionalSearchText = signal('');
  clientSearch = '';
  selectedDate = '';
  notes = '';

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

  readonly canSubmit = computed(() => !!this.selectedProfessionalId() && !!this.selectedClientId() && !!this.selectedSlot());

  private searchTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.profService.list().subscribe({ next: (list) => this.professionals.set(list.filter((p) => p.active)) });
    this.svcService.list().subscribe({ next: (list) => this.services.set(list.filter((s) => s.active)) });
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

  onServiceSearch(value: string): void {
    this.serviceSearchText.set(value);
  }

  onProfessionalSearch(value: string): void {
    this.professionalSearchText.set(value);
  }

  selectProfessional(pro: ProfessionalResponse): void {
    this.selectedProfessionalId.set(pro.id);
    this.selectedProfessionalName.set(pro.firstName + ' ' + pro.lastName);
    this.selectedSlot.set(null);
    this.slots.set([]);
    if (this.selectedDate) this.loadSlots();
  }

  clearProfessional(): void {
    this.selectedProfessionalId.set(null);
    this.selectedProfessionalName.set('');
    this.selectedSlot.set(null);
    this.slots.set([]);
  }

  selectService(svc: ServiceTypeResponse): void {
    this.selectedServiceId.set(svc.id);
    this.selectedServiceName.set(svc.name);
    this.selectedServiceColor.set(svc.color ?? null);
    this.selectedDuration.set(svc.durationMinutes);
    this.resetProfessionalIfNeeded();
    this.selectedSlot.set(null);
    this.slots.set([]);
    if (this.selectedDate && this.selectedProfessionalId()) this.loadSlots();
  }

  selectNoService(): void {
    this.selectedServiceId.set(null);
    this.selectedServiceName.set('');
    this.selectedServiceColor.set(null);
    this.selectedDuration.set(30);
    this.resetProfessionalIfNeeded();
    this.selectedSlot.set(null);
    this.slots.set([]);
  }

  private resetProfessionalIfNeeded(): void {
    const profId = this.selectedProfessionalId();
    if (profId && !this.filteredProfessionals().find((p) => p.id === profId)) {
      this.selectedProfessionalId.set(null);
    }
  }

  loadSlots(): void {
    const profId = this.selectedProfessionalId();
    if (!profId || !this.selectedDate) return;
    this.slotsLoading.set(true);
    this.selectedSlot.set(null);
    this.profService.getAvailableSlots(profId, this.selectedDate, this.selectedDuration()).subscribe({
      next: (s) => {
        this.slots.set(s);
        this.slotsLoading.set(false);
      },
      error: () => this.slotsLoading.set(false),
    });
  }

  selectSlot(slot: TimeSlotResponse): void {
    this.selectedSlot.set(slot);
  }

  formatSlotTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  }

  onSubmit(): void {
    const slot = this.selectedSlot();
    const profId = this.selectedProfessionalId();
    const clientId = this.selectedClientId();
    if (!slot || !profId || !clientId) return;

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
