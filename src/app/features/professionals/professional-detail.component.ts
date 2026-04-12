import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { ProfessionalService } from '../../core/services/professional.service';
import type { ProfessionalResponse, AvailabilityResponse, AvailabilityExceptionResponse, AvailabilitySlotRequest } from '../../core/models/domain.model';
import { FormsModule } from '@angular/forms';

const DAYS = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

@Component({
  selector: 'app-professional-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, PageShellComponent, CardComponent, ButtonComponent, BadgeComponent, ConfirmDialogComponent],
  template: `
    <app-page-shell>
      <div class="mx-auto max-w-4xl">
        <a routerLink="/professionisti" class="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Torna al team
        </a>

        @if (isLoading()) {
          <div class="flex justify-center py-12">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
          </div>
        }

        @if (professional()) {
          <!-- Header -->
          <div class="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-lg font-bold text-violet-700">
                {{ professional()!.firstName.charAt(0) }}{{ professional()!.lastName.charAt(0) }}
              </div>
              <div>
                <h2 class="text-2xl font-bold text-gray-900">{{ professional()!.firstName }} {{ professional()!.lastName }}</h2>
                <div class="flex items-center gap-2 mt-1">
                  <app-badge [variant]="professional()!.active ? 'green' : 'gray'">{{ professional()!.active ? 'Attivo' : 'Inattivo' }}</app-badge>
                  @if (professional()!.email) {
                    <span class="text-sm text-gray-500">{{ professional()!.email }}</span>
                  }
                </div>
              </div>
            </div>
            <div class="flex gap-2">
              <a [routerLink]="['/professionisti', professional()!.id, 'modifica']">
                <app-button variant="secondary">Modifica</app-button>
              </a>
              <app-button variant="danger" (click)="deleteDialogOpen.set(true)">Elimina</app-button>
            </div>
          </div>

          <!-- Tabs -->
          <div class="mb-6 flex gap-1 border-b border-gray-200">
            @for (tab of tabs; track tab.key) {
              <button (click)="activeTab.set(tab.key)"
                [class]="activeTab() === tab.key
                  ? 'border-b-2 border-indigo-600 pb-3 px-4 text-sm font-semibold text-indigo-600'
                  : 'pb-3 px-4 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors'">
                {{ tab.label }}
              </button>
            }
          </div>

          <!-- Tab: Info -->
          @if (activeTab() === 'info') {
            <div class="grid gap-6 sm:grid-cols-2">
              <app-card>
                <h3 class="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Contatto</h3>
                <dl class="space-y-3">
                  <div>
                    <dt class="text-xs text-gray-400">Email</dt>
                    <dd class="text-sm text-gray-900">{{ professional()!.email || '—' }}</dd>
                  </div>
                  <div>
                    <dt class="text-xs text-gray-400">Telefono</dt>
                    <dd class="text-sm text-gray-900">{{ professional()!.phone || '—' }}</dd>
                  </div>
                  <div>
                    <dt class="text-xs text-gray-400">Membro dal</dt>
                    <dd class="text-sm text-gray-900">{{ formatDate(professional()!.createdAt) }}</dd>
                  </div>
                </dl>
              </app-card>
            </div>
          }

          <!-- Tab: Availability -->
          @if (activeTab() === 'availability') {
            <app-card>
              <h3 class="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Orari settimanali</h3>
              <div class="space-y-3">
                @for (day of daySlots; track day.dayOfWeek) {
                  <div class="flex items-center gap-3 rounded-lg border border-gray-100 p-3">
                    <span class="w-24 text-sm font-medium text-gray-700">{{ dayName(day.dayOfWeek) }}</span>
                    <label class="relative inline-flex cursor-pointer items-center">
                      <input type="checkbox" [checked]="day.enabled" (change)="toggleDay(day.dayOfWeek)" class="peer sr-only" />
                      <div class="h-5 w-9 rounded-full bg-gray-200 after:absolute after:start-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                    </label>
                    @if (day.enabled) {
                      <input type="time" [value]="day.startTime" (change)="updateSlotTime(day.dayOfWeek, 'start', $event)"
                        class="rounded border border-gray-200 px-2 py-1 text-sm" />
                      <span class="text-gray-400">—</span>
                      <input type="time" [value]="day.endTime" (change)="updateSlotTime(day.dayOfWeek, 'end', $event)"
                        class="rounded border border-gray-200 px-2 py-1 text-sm" />
                    } @else {
                      <span class="text-sm text-gray-400">Non disponibile</span>
                    }
                  </div>
                }
              </div>
              <div class="mt-5 flex justify-end">
                <app-button [isLoading]="savingAvailability()" (click)="saveAvailability()">Salva orari</app-button>
              </div>
            </app-card>

            <!-- Exceptions -->
            <app-card extraClass="mt-6">
              <h3 class="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Eccezioni</h3>
              @if (exceptions().length === 0) {
                <p class="text-sm text-gray-400">Nessuna eccezione configurata</p>
              } @else {
                <div class="space-y-2 mb-4">
                  @for (exc of exceptions(); track exc.id) {
                    <div class="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3">
                      <div>
                        <span class="text-sm font-medium text-gray-900">{{ formatDate(exc.date) }}</span>
                        @if (exc.isUnavailable) {
                          <app-badge variant="red" class="ml-2">Non disponibile</app-badge>
                        } @else {
                          <span class="ml-2 text-sm text-gray-500">{{ exc.startTime }} - {{ exc.endTime }}</span>
                        }
                        @if (exc.reason) {
                          <span class="ml-2 text-xs text-gray-400">{{ exc.reason }}</span>
                        }
                      </div>
                      <button (click)="removeException(exc.id)" class="text-sm text-red-500 hover:text-red-700 transition-colors">Rimuovi</button>
                    </div>
                  }
                </div>
              }
              <!-- Add exception form -->
              <div class="mt-4 flex flex-wrap items-end gap-3 border-t border-gray-100 pt-4">
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Data</label>
                  <input type="date" [(ngModel)]="newExcDate" class="rounded border border-gray-200 px-2 py-1.5 text-sm" />
                </div>
                <label class="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" [(ngModel)]="newExcUnavailable" class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  Tutto il giorno
                </label>
                @if (!newExcUnavailable) {
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">Dalle</label>
                    <input type="time" [(ngModel)]="newExcStart" class="rounded border border-gray-200 px-2 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">Alle</label>
                    <input type="time" [(ngModel)]="newExcEnd" class="rounded border border-gray-200 px-2 py-1.5 text-sm" />
                  </div>
                }
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Motivo</label>
                  <input type="text" [(ngModel)]="newExcReason" placeholder="Opzionale" class="rounded border border-gray-200 px-2 py-1.5 text-sm" />
                </div>
                <app-button (click)="addException()" [disabled]="!newExcDate">Aggiungi</app-button>
              </div>
            </app-card>
          }
        }

        <app-confirm-dialog
          [open]="deleteDialogOpen()"
          title="Elimina professionista"
          message="Sei sicuro? Gli appuntamenti associati non verranno eliminati."
          confirmLabel="Elimina"
          [isLoading]="isDeleting()"
          (onConfirm)="deleteProfessional()"
          (onCancel)="deleteDialogOpen.set(false)"
        />
      </div>
    </app-page-shell>
  `,
})
export class ProfessionalDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly profService = inject(ProfessionalService);

  readonly professional = signal<ProfessionalResponse | null>(null);
  readonly availability = signal<AvailabilityResponse[]>([]);
  readonly exceptions = signal<AvailabilityExceptionResponse[]>([]);
  readonly isLoading = signal(true);
  readonly activeTab = signal<'info' | 'availability'>('info');
  readonly deleteDialogOpen = signal(false);
  readonly isDeleting = signal(false);
  readonly savingAvailability = signal(false);

  readonly tabs = [
    { key: 'info' as const, label: 'Informazioni' },
    { key: 'availability' as const, label: 'Disponibilità' },
  ];

  daySlots: { dayOfWeek: number; enabled: boolean; startTime: string; endTime: string }[] = [];

  // Exception form
  newExcDate = '';
  newExcUnavailable = true;
  newExcStart = '09:00';
  newExcEnd = '18:00';
  newExcReason = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.profService.getById(id).subscribe({
      next: (p) => {
        this.professional.set(p);
        this.isLoading.set(false);
      },
      error: () => this.router.navigate(['/professionisti']),
    });
    this.profService.getAvailability(id).subscribe({
      next: (slots) => {
        this.availability.set(slots);
        this.buildDaySlots(slots);
      },
    });
    this.profService.getExceptions(id).subscribe({ next: (e) => this.exceptions.set(e) });
  }

  private buildDaySlots(slots: AvailabilityResponse[]): void {
    this.daySlots = Array.from({ length: 7 }, (_, i) => {
      const dow = i + 1; // 1=Mon..7=Sun
      const slot = slots.find((s) => s.dayOfWeek === dow);
      return { dayOfWeek: dow, enabled: !!slot, startTime: slot?.startTime ?? '09:00', endTime: slot?.endTime ?? '18:00' };
    });
  }

  dayName(dow: number): string {
    return DAYS[dow - 1] ?? '';
  }

  toggleDay(dow: number): void {
    const idx = this.daySlots.findIndex((d) => d.dayOfWeek === dow);
    if (idx >= 0) this.daySlots[idx].enabled = !this.daySlots[idx].enabled;
  }

  updateSlotTime(dow: number, which: 'start' | 'end', event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    const idx = this.daySlots.findIndex((d) => d.dayOfWeek === dow);
    if (idx >= 0) {
      if (which === 'start') this.daySlots[idx].startTime = val;
      else this.daySlots[idx].endTime = val;
    }
  }

  saveAvailability(): void {
    this.savingAvailability.set(true);
    const slots: AvailabilitySlotRequest[] = this.daySlots
      .filter((d) => d.enabled)
      .map((d) => ({ dayOfWeek: d.dayOfWeek, startTime: d.startTime, endTime: d.endTime }));
    this.profService.setAvailability(this.professional()!.id, slots).subscribe({
      next: (updated) => {
        this.availability.set(updated);
        this.buildDaySlots(updated);
        this.savingAvailability.set(false);
      },
      error: () => this.savingAvailability.set(false),
    });
  }

  addException(): void {
    if (!this.newExcDate) return;
    const payload = {
      date: this.newExcDate,
      isUnavailable: this.newExcUnavailable,
      startTime: this.newExcUnavailable ? undefined : this.newExcStart,
      endTime: this.newExcUnavailable ? undefined : this.newExcEnd,
      reason: this.newExcReason || undefined,
    };
    this.profService.addException(this.professional()!.id, payload).subscribe({
      next: (exc) => {
        this.exceptions.update((list) => [...list, exc]);
        this.newExcDate = '';
        this.newExcReason = '';
      },
    });
  }

  removeException(id: string): void {
    this.profService.removeException(this.professional()!.id, id).subscribe({
      next: () => this.exceptions.update((list) => list.filter((e) => e.id !== id)),
    });
  }

  deleteProfessional(): void {
    this.isDeleting.set(true);
    this.profService.delete(this.professional()!.id).subscribe({
      next: () => this.router.navigate(['/professionisti']),
      error: () => this.isDeleting.set(false),
    });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
