import { Component, inject, OnInit, signal } from '@angular/core';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ProfessionalPortalService } from '../../core/services/professional-portal.service';
import { FormsModule } from '@angular/forms';
import type { AvailabilityResponse, AvailabilityExceptionResponse, AvailabilitySlotRequest, AvailabilityExceptionSlot } from '../../core/models/domain.model';

const DAYS = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

@Component({
  selector: 'app-professional-availability',
  standalone: true,
  imports: [PageShellComponent, CardComponent, ButtonComponent, BadgeComponent, FormsModule],
  template: `
    <app-page-shell>
      <div class="mx-auto max-w-3xl">
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-gray-900">Disponibilità</h2>
          <p class="text-sm text-gray-500">Configura i tuoi orari settimanali e le eccezioni</p>
        </div>

        <!-- Weekly hours -->
        <app-card>
          <h3 class="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Orari settimanali</h3>

          @if (isLoading()) {
            <div class="flex justify-center py-8">
              <div class="h-7 w-7 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
            </div>
          } @else {
            <div class="space-y-3">
              @for (day of daySlots; track day.dayOfWeek) {
                <div class="flex items-center gap-3 rounded-lg border border-gray-100 p-3">
                  <span class="w-24 text-sm font-medium text-gray-700">{{ dayName(day.dayOfWeek) }}</span>
                  <label class="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" [checked]="day.enabled" (change)="toggleDay(day.dayOfWeek)" class="peer sr-only" />
                    <div class="h-5 w-9 rounded-full bg-gray-200 after:absolute after:start-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                  </label>
                  @if (day.enabled) {
                    <input type="time" [value]="day.startTime" (change)="updateTime(day.dayOfWeek, 'start', $event)"
                      class="rounded border border-gray-200 px-2 py-1 text-sm" />
                    <span class="text-gray-400">—</span>
                    <input type="time" [value]="day.endTime" (change)="updateTime(day.dayOfWeek, 'end', $event)"
                      class="rounded border border-gray-200 px-2 py-1 text-sm" />
                  } @else {
                    <span class="text-sm text-gray-400 italic">Non disponibile</span>
                  }
                </div>
              }
            </div>
            <div class="mt-5 flex justify-end">
              <app-button [isLoading]="saving()" (click)="save()">Salva orari</app-button>
            </div>
          }
        </app-card>

        <!-- Exceptions -->
        <app-card extraClass="mt-6">
          <h3 class="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Eccezioni e chiusure</h3>

          @if (exceptions().length === 0) {
            <p class="text-sm text-gray-400 mb-4">Nessuna eccezione configurata</p>
          } @else {
            <div class="space-y-2 mb-6">
              @for (exc of exceptions(); track exc.id) {
                <div class="flex items-start justify-between rounded-lg border border-gray-100 px-4 py-3">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-3 flex-wrap">
                      <span class="text-sm font-medium text-gray-900">{{ formatDate(exc.date) }}</span>
                      @if (exc.isUnavailableAllDay) {
                        <app-badge variant="red">Giornata chiusa</app-badge>
                      }
                      @if (exc.reason) {
                        <span class="text-xs text-gray-400">{{ exc.reason }}</span>
                      }
                    </div>
                    @if (!exc.isUnavailableAllDay && exc.slots.length > 0) {
                      <div class="mt-1.5 space-y-0.5">
                        @for (slot of exc.slots; track slot.id) {
                          <div class="text-sm text-gray-500">
                            Non disponibile: {{ slot.startTime }} – {{ slot.endTime }}
                          </div>
                        }
                      </div>
                    }
                  </div>
                  <button (click)="removeException(exc.id)"
                    class="text-sm text-red-500 hover:text-red-700 transition-colors font-medium shrink-0 ml-3">
                    Rimuovi
                  </button>
                </div>
              }
            </div>
          }

          <!-- Add exception form -->
          <div class="border-t border-gray-100 pt-4">
            <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Aggiungi eccezione</p>
            <div class="space-y-4">
              <!-- Date -->
              <div>
                <label class="block text-xs text-gray-500 mb-1">Data</label>
                <input type="date" [(ngModel)]="newExcDate"
                  class="rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>

              <!-- All day toggle -->
              <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" [(ngModel)]="newExcUnavailableAllDay"
                  class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                Giornata intera non disponibile
              </label>

              <!-- Time slots (conditional) -->
              @if (!newExcUnavailableAllDay) {
                <div class="rounded-lg border border-gray-100 p-3 bg-gray-50/50">
                  <p class="text-xs font-medium text-gray-500 mb-2">Fasce di indisponibilità</p>
                  <div class="space-y-2">
                    @for (slot of newExcSlots; track $index) {
                      <div class="flex items-center gap-2">
                        <input type="time" [(ngModel)]="slot.startTime"
                          class="rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none bg-white" />
                        <span class="text-gray-400 text-xs">–</span>
                        <input type="time" [(ngModel)]="slot.endTime"
                          class="rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none bg-white" />
                        <button (click)="removeSlot($index)"
                          class="text-red-400 hover:text-red-600 transition-colors text-sm font-medium ml-1">
                          ✕
                        </button>
                        @if (slot.startTime && slot.endTime && slot.startTime >= slot.endTime) {
                          <span class="text-xs text-red-500">Orario non valido</span>
                        }
                      </div>
                    }
                  </div>
                  <button (click)="addSlot()" type="button"
                    class="mt-2 inline-flex items-center gap-1 rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-xs text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                    <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                    Aggiungi fascia
                  </button>
                  @if (slotError) {
                    <p class="mt-2 text-xs text-red-500">{{ slotError }}</p>
                  }
                </div>
              }

              <!-- Reason -->
              <div>
                <label class="block text-xs text-gray-500 mb-1">Motivo (opzionale)</label>
                <input type="text" [(ngModel)]="newExcReason" placeholder="es. Ferie"
                  class="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>

              <div class="flex justify-end">
                <app-button [disabled]="!newExcDate" [isLoading]="addingExc()" (click)="addException()">
                  Aggiungi
                </app-button>
              </div>
            </div>
          </div>
        </app-card>
      </div>
    </app-page-shell>
  `,
})
export class ProfessionalAvailabilityComponent implements OnInit {
  private readonly portalService = inject(ProfessionalPortalService);

  readonly isLoading = signal(true);
  readonly saving = signal(false);
  readonly addingExc = signal(false);
  readonly exceptions = signal<AvailabilityExceptionResponse[]>([]);

  daySlots: { dayOfWeek: number; enabled: boolean; startTime: string; endTime: string }[] = this.defaultDaySlots();

  // Exception form
  newExcDate = '';
  newExcUnavailableAllDay = true;
  newExcSlots: AvailabilityExceptionSlot[] = [];
  newExcReason = '';
  slotError = '';

  ngOnInit(): void {
    this.portalService.getAvailability().subscribe({
      next: (slots) => {
        this.buildDaySlots(slots);
        this.isLoading.set(false);
      },
      error: () => {
        this.daySlots = this.defaultDaySlots();
        this.isLoading.set(false);
      },
    });
    this.portalService.getExceptions().subscribe({ next: (e) => this.exceptions.set(e) });
  }

  private defaultDaySlots() {
    return Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i + 1, enabled: false, startTime: '09:00', endTime: '18:00',
    }));
  }

  private buildDaySlots(slots: AvailabilityResponse[]): void {
    this.daySlots = Array.from({ length: 7 }, (_, i) => {
      const dow = i + 1;
      const slot = slots.find((s) => s.dayOfWeek === dow);
      return { dayOfWeek: dow, enabled: !!slot, startTime: slot?.startTime ?? '09:00', endTime: slot?.endTime ?? '18:00' };
    });
  }

  dayName(dow: number): string { return DAYS[dow - 1] ?? ''; }

  toggleDay(dow: number): void {
    const idx = this.daySlots.findIndex((d) => d.dayOfWeek === dow);
    if (idx >= 0) this.daySlots[idx].enabled = !this.daySlots[idx].enabled;
  }

  updateTime(dow: number, which: 'start' | 'end', event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    const idx = this.daySlots.findIndex((d) => d.dayOfWeek === dow);
    if (idx >= 0) {
      if (which === 'start') this.daySlots[idx].startTime = val;
      else this.daySlots[idx].endTime = val;
    }
  }

  save(): void {
    this.saving.set(true);
    const slots: AvailabilitySlotRequest[] = this.daySlots
      .filter((d) => d.enabled)
      .map((d) => ({ dayOfWeek: d.dayOfWeek, startTime: d.startTime, endTime: d.endTime }));
    this.portalService.setAvailability(slots).subscribe({
      next: (updated) => { this.buildDaySlots(updated); this.saving.set(false); },
      error: () => this.saving.set(false),
    });
  }

  // ── Slot management ──

  addSlot(): void {
    this.newExcSlots = [...this.newExcSlots, { startTime: '09:00', endTime: '10:00' }];
    this.slotError = '';
  }

  removeSlot(index: number): void {
    this.newExcSlots = this.newExcSlots.filter((_, i) => i !== index);
  }

  // ── Exception CRUD ──

  addException(): void {
    if (!this.newExcDate) return;
    this.slotError = '';

    if (!this.newExcUnavailableAllDay) {
      if (this.newExcSlots.length === 0) {
        this.slotError = 'Aggiungi almeno una fascia oraria di indisponibilità';
        return;
      }
      const invalid = this.newExcSlots.find((s) => s.startTime >= s.endTime);
      if (invalid) {
        this.slotError = "L'orario di inizio deve essere precedente all'orario di fine per ogni fascia";
        return;
      }
    }

    this.addingExc.set(true);
    const payload = {
      date: this.newExcDate,
      isUnavailableAllDay: this.newExcUnavailableAllDay,
      slots: this.newExcUnavailableAllDay ? [] : this.newExcSlots,
      reason: this.newExcReason || undefined,
    };
    this.portalService.addException(payload).subscribe({
      next: (exc) => {
        this.exceptions.update((list) => [...list, exc]);
        this.newExcDate = '';
        this.newExcReason = '';
        this.newExcSlots = [];
        this.newExcUnavailableAllDay = true;
        this.addingExc.set(false);
      },
      error: () => this.addingExc.set(false),
    });
  }

  removeException(id: string): void {
    this.portalService.removeException(id).subscribe({
      next: () => this.exceptions.update((list) => list.filter((e) => e.id !== id)),
    });
  }

  formatDate(iso: string): string {
    return new Date(iso + 'T00:00:00').toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  }
}
