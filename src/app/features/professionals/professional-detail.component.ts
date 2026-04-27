import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { ProfessionalService } from '../../core/services/professional.service';
import { InvitationService } from '../../core/services/invitation.service';
import type { ProfessionalResponse, AvailabilityResponse, AvailabilityExceptionResponse, AvailabilitySlotRequest, InvitationResponse, AvailabilityExceptionSlot } from '../../core/models/domain.model';
import { FormsModule } from '@angular/forms';

const DAYS = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

interface DaySlot {
  dayOfWeek: number;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

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
                <h2 class="text-xl sm:text-2xl font-bold text-gray-900">{{ professional()!.firstName }} {{ professional()!.lastName }}</h2>
                <div class="flex items-center gap-2 mt-1 flex-wrap">
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
          <div class="mb-6 flex gap-1 border-b border-gray-200 overflow-x-auto">
            @for (tab of tabs; track tab.key) {
              <button (click)="activeTab.set(tab.key)"
                [class]="activeTab() === tab.key
                  ? 'border-b-2 border-indigo-600 pb-3 px-3 sm:px-4 text-sm font-semibold text-indigo-600 whitespace-nowrap'
                  : 'pb-3 px-3 sm:px-4 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors whitespace-nowrap'">
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

              <!-- Invitation card -->
              <app-card>
                <h3 class="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Accesso portale</h3>

                @if (invitation()) {
                  @if (invitation()!.status === 'ACCEPTED') {
                    <div class="flex items-center gap-2">
                      <app-badge variant="green">Registrato</app-badge>
                      <span class="text-sm text-gray-500">Il professionista ha già accettato l'invito.</span>
                    </div>
                  } @else if (invitation()!.status === 'PENDING') {
                    <div class="space-y-3">
                      <div class="flex items-center gap-2">
                        <app-badge variant="amber">In attesa</app-badge>
                        <span class="text-xs text-gray-400">Scade il {{ formatDate(invitation()!.expiresAt) }}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <input readonly [value]="invitation()!.inviteLink"
                          class="flex-1 truncate rounded border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-700 font-mono" />
                        <app-button variant="secondary" (click)="copyLink()">
                          {{ copied() ? 'Copiato!' : 'Copia' }}
                        </app-button>
                      </div>
                      <app-button variant="danger" [isLoading]="revokingInvite()" (click)="revokeInvite()">
                        Revoca invito
                      </app-button>
                    </div>
                  } @else {
                    <!-- EXPIRED or REVOKED — allow re-invite -->
                    <p class="mb-3 text-sm text-gray-500">
                      Invito <span class="font-medium">{{ invitation()!.status === 'EXPIRED' ? 'scaduto' : 'revocato' }}</span>.
                      Puoi generarne uno nuovo.
                    </p>
                    <app-button [isLoading]="creatingInvite()" (click)="createInvite()">Genera nuovo invito</app-button>
                  }
                } @else if (inviteLoading()) {
                  <div class="h-6 w-6 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
                } @else {
                  <p class="mb-3 text-sm text-gray-500">Il professionista non ha ancora accesso al portale.</p>
                  @if (!professional()!.email) {
                    <p class="text-xs text-amber-600">⚠ Aggiungi prima un'email al professionista.</p>
                  } @else {
                    <app-button [isLoading]="creatingInvite()" (click)="createInvite()">Invia invito</app-button>
                  }
                }
              </app-card>
            </div>
          }

          <!-- Tab: Availability -->
          @if (activeTab() === 'availability') {
            <app-card>
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <h3 class="text-sm font-semibold uppercase tracking-wider text-gray-400">Orari settimanali</h3>
                <div class="flex items-center gap-2">
                  <button (click)="activateWeekdays()" type="button"
                    class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors">
                    Attiva Lun-Ven
                  </button>
                  <button (click)="activateAll()" type="button"
                    class="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 transition-colors">
                    Attiva tutti
                  </button>
                  <button (click)="deactivateAll()" type="button"
                    class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors">
                    Disattiva tutti
                  </button>
                </div>
              </div>

              <!-- Preset selector -->
              <div class="mb-5 flex flex-wrap items-center gap-2">
                <span class="text-xs text-gray-400 font-medium">Preset:</span>
                <button (click)="applyPreset('09:00', '18:00')" type="button"
                  class="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors">
                  9:00 – 18:00
                </button>
                <button (click)="applyPreset('09:00', '13:00')" type="button"
                  class="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors">
                  9:00 – 13:00
                </button>
                <button (click)="applyPreset('14:00', '20:00')" type="button"
                  class="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors">
                  14:00 – 20:00
                </button>
                <button (click)="applyPreset('08:00', '12:00')" type="button"
                  class="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors">
                  8:00 – 12:00
                </button>
              </div>

              <div class="space-y-2">
                @for (day of daySlots; track day.dayOfWeek) {
                  <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-xl border p-3 sm:p-4 transition-all duration-200"
                    [class.border-indigo-200]="day.enabled"
                    [class.bg-indigo-50/30]="day.enabled"
                    [class.border-gray-100]="!day.enabled"
                    [class.bg-gray-50/30]="!day.enabled">
                    <div class="flex items-center gap-3 min-w-0 sm:w-36">
                      <label class="relative inline-flex cursor-pointer items-center shrink-0">
                        <input type="checkbox" [checked]="day.enabled" (change)="toggleDay(day.dayOfWeek)" class="peer sr-only" />
                        <div class="h-6 w-11 rounded-full bg-gray-200 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                      </label>
                      <span class="text-sm font-medium" [class.text-gray-900]="day.enabled" [class.text-gray-400]="!day.enabled">
                        <span class="hidden sm:inline">{{ dayName(day.dayOfWeek) }}</span>
                        <span class="sm:hidden">{{ dayShortName(day.dayOfWeek) }}</span>
                      </span>
                    </div>
                    @if (day.enabled) {
                      <div class="flex items-center gap-2 sm:gap-3 flex-1">
                        <div class="flex items-center gap-2 flex-1 sm:flex-none">
                          <span class="text-xs text-gray-400 hidden sm:inline">Dalle</span>
                          <input type="time" [value]="day.startTime" (change)="updateSlotTime(day.dayOfWeek, 'start', $event)"
                            class="flex-1 sm:flex-none rounded-lg border border-gray-200 px-2.5 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-colors" />
                        </div>
                        <svg class="h-4 w-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                        </svg>
                        <div class="flex items-center gap-2 flex-1 sm:flex-none">
                          <span class="text-xs text-gray-400 hidden sm:inline">Alle</span>
                          <input type="time" [value]="day.endTime" (change)="updateSlotTime(day.dayOfWeek, 'end', $event)"
                            class="flex-1 sm:flex-none rounded-lg border border-gray-200 px-2.5 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-colors" />
                        </div>
                      </div>
                    } @else {
                      <span class="text-sm text-gray-400 italic">Non disponibile</span>
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
                    <div class="flex items-start justify-between rounded-lg border border-gray-100 px-3 sm:px-4 py-3">
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="text-sm font-medium text-gray-900">{{ formatDate(exc.date) }}</span>
                          @if (exc.isUnavailableAllDay) {
                            <app-badge variant="red">Giornata chiusa</app-badge>
                          }
                          @if (exc.reason) {
                            <span class="text-xs text-gray-400 hidden sm:inline">{{ exc.reason }}</span>
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
                      <button (click)="removeException(exc.id)" class="text-sm text-red-500 hover:text-red-700 transition-colors shrink-0 ml-3">Rimuovi</button>
                    </div>
                  }
                </div>
              }
              <!-- Add exception form -->
              <div class="mt-4 border-t border-gray-100 pt-4">
                <div class="space-y-4">
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">Data</label>
                    <input type="date" [(ngModel)]="newExcDate" class="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm" />
                  </div>
                  <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" [(ngModel)]="newExcUnavailableAllDay" class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    Giornata intera non disponibile
                  </label>
                  @if (!newExcUnavailableAllDay) {
                    <div class="rounded-lg border border-gray-100 p-3 bg-gray-50/50">
                      <p class="text-xs font-medium text-gray-500 mb-2">Fasce di indisponibilità</p>
                      <div class="space-y-2">
                        @for (slot of newExcSlots; track $index) {
                          <div class="flex items-center gap-2">
                            <input type="time" [(ngModel)]="slot.startTime"
                              class="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none bg-white" />
                            <span class="text-gray-400 text-xs">–</span>
                            <input type="time" [(ngModel)]="slot.endTime"
                              class="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none bg-white" />
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
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">Motivo</label>
                    <input type="text" [(ngModel)]="newExcReason" placeholder="Opzionale" class="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm" />
                  </div>
                  <div class="flex justify-end">
                    <app-button (click)="addException()" [disabled]="!newExcDate">Aggiungi</app-button>
                  </div>
                </div>
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
  private readonly invitationService = inject(InvitationService);

  readonly professional = signal<ProfessionalResponse | null>(null);
  readonly availability = signal<AvailabilityResponse[]>([]);
  readonly exceptions = signal<AvailabilityExceptionResponse[]>([]);
  readonly isLoading = signal(true);
  readonly activeTab = signal<'info' | 'availability'>('info');
  readonly deleteDialogOpen = signal(false);
  readonly isDeleting = signal(false);
  readonly savingAvailability = signal(false);

  // Invitation
  readonly invitation = signal<InvitationResponse | null>(null);
  readonly inviteLoading = signal(true);
  readonly creatingInvite = signal(false);
  readonly revokingInvite = signal(false);
  readonly copied = signal(false);

  readonly tabs = [
    { key: 'info' as const, label: 'Informazioni' },
    { key: 'availability' as const, label: 'Disponibilità' },
  ];

  daySlots: DaySlot[] = [];

  // Exception form
  newExcDate = '';
  newExcUnavailableAllDay = true;
  newExcSlots: AvailabilityExceptionSlot[] = [];
  newExcReason = '';
  slotError = '';

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

    // Load pending/accepted invitation for this professional
    this.invitationService.list().subscribe({
      next: (invites) => {
        const found = invites
          .filter((i) => i.professionalId === id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;
        this.invitation.set(found);
        this.inviteLoading.set(false);
      },
      error: () => this.inviteLoading.set(false),
    });
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

  dayShortName(dow: number): string {
    return DAYS_SHORT[dow - 1] ?? '';
  }

  toggleDay(dow: number): void {
    const idx = this.daySlots.findIndex((d) => d.dayOfWeek === dow);
    if (idx >= 0) this.daySlots[idx].enabled = !this.daySlots[idx].enabled;
  }

  /** Activate Monday-Friday with current times */
  activateWeekdays(): void {
    this.daySlots.forEach((d) => {
      d.enabled = d.dayOfWeek <= 5;
    });
  }

  /** Activate all days Mon-Sun */
  activateAll(): void {
    this.daySlots.forEach((d) => { d.enabled = true; });
  }

  /** Deactivate all days */
  deactivateAll(): void {
    this.daySlots.forEach((d) => { d.enabled = false; });
  }

  /** Apply a time preset to all currently enabled days */
  applyPreset(start: string, end: string): void {
    this.daySlots.forEach((d) => {
      if (d.enabled) {
        d.startTime = start;
        d.endTime = end;
      }
    });
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

  addSlot(): void {
    this.newExcSlots = [...this.newExcSlots, { startTime: '09:00', endTime: '10:00' }];
    this.slotError = '';
  }

  removeSlot(index: number): void {
    this.newExcSlots = this.newExcSlots.filter((_, i) => i !== index);
  }

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

    const payload = {
      date: this.newExcDate,
      isUnavailableAllDay: this.newExcUnavailableAllDay,
      slots: this.newExcUnavailableAllDay ? [] : this.newExcSlots,
      reason: this.newExcReason || undefined,
    };
    this.profService.addException(this.professional()!.id, payload).subscribe({
      next: (exc) => {
        this.exceptions.update((list) => [...list, exc]);
        this.newExcDate = '';
        this.newExcReason = '';
        this.newExcSlots = [];
        this.newExcUnavailableAllDay = true;
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

  createInvite(): void {
    const prof = this.professional();
    if (!prof?.email) return;
    this.creatingInvite.set(true);
    this.invitationService.create({ professionalId: prof.id, email: prof.email }).subscribe({
      next: (inv) => {
        this.invitation.set(inv);
        this.creatingInvite.set(false);
      },
      error: () => this.creatingInvite.set(false),
    });
  }

  revokeInvite(): void {
    const inv = this.invitation();
    if (!inv) return;
    this.revokingInvite.set(true);
    this.invitationService.revoke(inv.id).subscribe({
      next: () => {
        this.invitation.set({ ...inv, status: 'REVOKED' });
        this.revokingInvite.set(false);
      },
      error: () => this.revokingInvite.set(false),
    });
  }

  copyLink(): void {
    const link = this.invitation()?.inviteLink;
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
