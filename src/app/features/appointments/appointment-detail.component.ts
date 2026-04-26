import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { AppointmentService } from '../../core/services/appointment.service';
import { ProfessionalService } from '../../core/services/professional.service';
import type { AppointmentResponse, AppointmentStatus, ProfessionalResponse } from '../../core/models/domain.model';
import { getErrorMessage } from '../../shared/utils/errors';

const MONTHS_IT = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
const DAYS_IT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

@Component({
  selector: 'app-appointment-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, PageShellComponent, CardComponent, ButtonComponent, BadgeComponent, ConfirmDialogComponent, AlertComponent],
  template: `
    <app-page-shell>
      <div class="mx-auto max-w-3xl">
        <a routerLink="/appuntamenti" class="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Torna alla lista
        </a>

        @if (isLoading()) {
          <div class="flex justify-center py-12">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
          </div>
        }

        @if (error()) {
          <app-alert variant="error" [message]="error()" class="mb-4" />
        }

        @if (apt()) {
          <!-- Header -->
          <div class="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div class="flex items-center gap-3 flex-wrap">
                <h2 class="text-xl sm:text-2xl font-bold text-gray-900">Appuntamento</h2>
                <app-badge [variant]="statusVariant(apt()!.status)">{{ statusLabel(apt()!.status) }}</app-badge>
              </div>
              <p class="mt-1 text-sm text-gray-500">{{ formatFull(apt()!.startDatetime) }} — {{ formatTime(apt()!.endDatetime) }}</p>
            </div>
            @if (isEditable()) {
              <app-button variant="secondary" (click)="toggleEditMode()">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                Modifica
              </app-button>
            }
          </div>

          <!-- Edit form -->
          @if (editMode()) {
            <app-card extraClass="mb-6 !border-indigo-200 !border-2">
              <h3 class="mb-4 text-lg font-semibold text-gray-900">Modifica appuntamento</h3>

              <!-- Date picker (mini calendar) -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Data</label>
                <div class="rounded-xl border border-gray-200 overflow-hidden max-w-sm">
                  <div class="flex items-center justify-between bg-gray-50 px-3 py-2">
                    <button (click)="editCalPrevMonth()" type="button" class="rounded-lg p-1 text-gray-500 hover:bg-gray-200 transition-colors">
                      <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                    </button>
                    <span class="text-xs font-semibold text-gray-900">{{ editCalMonthLabel() }}</span>
                    <button (click)="editCalNextMonth()" type="button" class="rounded-lg p-1 text-gray-500 hover:bg-gray-200 transition-colors">
                      <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                    </button>
                  </div>
                  <div class="grid grid-cols-7 bg-gray-50 border-t border-gray-100">
                    @for (day of daysOfWeek; track day) {
                      <div class="py-1.5 text-center text-[10px] font-medium text-gray-400 uppercase">{{ day }}</div>
                    }
                  </div>
                  <div class="grid grid-cols-7">
                    @for (day of editCalDays(); track $index) {
                      @if (day) {
                        <button (click)="editDate = day.dateStr" type="button"
                          [disabled]="day.isPast"
                          [class]="day.dateStr === editDate
                            ? 'relative py-2 text-center text-xs bg-indigo-600 text-white font-semibold rounded-lg shadow-sm transition-all'
                            : day.isPast
                              ? 'relative py-2 text-center text-xs text-gray-300 cursor-not-allowed'
                              : day.isToday
                                ? 'relative py-2 text-center text-xs text-indigo-700 font-bold hover:bg-indigo-50 rounded-lg'
                                : 'relative py-2 text-center text-xs text-gray-700 hover:bg-gray-100 rounded-lg transition-colors'">
                          {{ day.num }}
                        </button>
                      } @else {
                        <div class="py-2"></div>
                      }
                    }
                  </div>
                </div>
              </div>

              <!-- Time + Duration + Professional -->
              <div class="grid gap-4 sm:grid-cols-3 mb-4">
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Ora inizio</label>
                  <input type="time" [(ngModel)]="editStartTime" step="300"
                    class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm bg-white shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-colors" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Durata (min)</label>
                  <input type="number" [(ngModel)]="editDuration" min="5" step="5"
                    class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm bg-white shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-colors" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Fine</label>
                  <div class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm bg-gray-100 text-gray-600">
                    {{ editEndTimeComputed() || '—' }}
                  </div>
                </div>
              </div>

              <!-- Professional selector -->
              <div class="mb-4">
                <label class="block text-xs font-medium text-gray-600 mb-1">Professionista</label>
                <div class="max-h-36 overflow-y-auto space-y-1">
                  @for (pro of allProfessionals(); track pro.id) {
                    <button (click)="editProfessionalId = pro.id" type="button"
                      [class]="editProfessionalId === pro.id
                        ? 'w-full rounded-lg border-2 border-indigo-600 bg-indigo-50 px-3 py-2 text-left text-sm'
                        : 'w-full rounded-lg border border-gray-200 px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors'">
                      <span class="font-medium text-gray-900">{{ pro.firstName }} {{ pro.lastName }}</span>
                    </button>
                  }
                </div>
              </div>

              <!-- Notes -->
              <div class="mb-4">
                <label class="block text-xs font-medium text-gray-600 mb-1">Note</label>
                <textarea [(ngModel)]="editNotes" rows="2"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none resize-none transition-colors">
                </textarea>
              </div>

              <div class="flex justify-end gap-3">
                <app-button variant="secondary" (click)="editMode.set(false)">Annulla</app-button>
                <app-button [isLoading]="actionLoading()" (click)="saveChanges()">Salva modifiche</app-button>
              </div>
            </app-card>
          }

          <!-- Details grid -->
          @if (!editMode()) {
            <div class="grid gap-6 sm:grid-cols-2 mb-6">
              <app-card>
                <h3 class="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Cliente</h3>
                <a [routerLink]="['/clienti', apt()!.clientId]" class="font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                  {{ apt()!.clientFullName }}
                </a>
              </app-card>
              <app-card>
                <h3 class="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Professionista</h3>
                <a [routerLink]="['/professionisti', apt()!.professionalId]" class="font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                  {{ apt()!.professionalFullName }}
                </a>
              </app-card>
              @if (apt()!.serviceTypeName) {
                <app-card>
                  <h3 class="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Servizio</h3>
                  <p class="text-sm text-gray-900">{{ apt()!.serviceTypeName }}</p>
                </app-card>
              }
              @if (apt()!.notes) {
                <app-card>
                  <h3 class="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Note</h3>
                  <p class="text-sm text-gray-700 whitespace-pre-line">{{ apt()!.notes }}</p>
                </app-card>
              }
              @if (apt()!.cancellationReason) {
                <app-card extraClass="sm:col-span-2 !border-red-200 !bg-red-50">
                  <h3 class="mb-2 text-sm font-semibold uppercase tracking-wider text-red-400">Motivo cancellazione</h3>
                  <p class="text-sm text-red-700">{{ apt()!.cancellationReason }}</p>
                  @if (apt()!.cancelledBy) {
                    <p class="mt-1 text-xs text-red-400">Cancellato da: {{ cancelledByLabel(apt()!.cancelledBy!) }}</p>
                  }
                </app-card>
              }
              @if (apt()!.proposedStart) {
                <app-card extraClass="sm:col-span-2 !border-blue-200 !bg-blue-50">
                  <h3 class="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-400">Nuovo orario proposto</h3>
                  <p class="text-sm text-blue-700">{{ formatFull(apt()!.proposedStart!) }} — {{ formatTime(apt()!.proposedEnd!) }}</p>
                </app-card>
              }
            </div>

            <!-- Actions -->
            <app-card>
              <h3 class="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Azioni</h3>
              <div class="flex flex-wrap gap-3">
                @if (apt()!.status === 'REQUESTED') {
                  <app-button (click)="confirm()" [isLoading]="actionLoading()">Conferma</app-button>
                  <app-button variant="secondary" (click)="showProposeForm.set(true)">Proponi nuovo orario</app-button>
                  <app-button variant="danger" (click)="cancelDialogOpen.set(true)">Rifiuta</app-button>
                }
                @if (apt()!.status === 'CONFIRMED') {
                  <app-button (click)="complete()" [isLoading]="actionLoading()">Completa</app-button>
                  <app-button variant="secondary" (click)="noShow()" [isLoading]="actionLoading()">Non presentato</app-button>
                  <app-button variant="danger" (click)="cancelDialogOpen.set(true)">Cancella</app-button>
                }
                @if (apt()!.status === 'PROPOSED_NEW_TIME') {
                  <app-button (click)="confirm()" [isLoading]="actionLoading()">Conferma nuovo orario</app-button>
                  <app-button variant="danger" (click)="cancelDialogOpen.set(true)">Cancella</app-button>
                }
                @if (apt()!.status === 'COMPLETED' || apt()!.status === 'CANCELLED' || apt()!.status === 'NO_SHOW') {
                  <p class="text-sm text-gray-400">Nessuna azione disponibile per questo stato.</p>
                }
              </div>

              <!-- Propose new time form -->
              @if (showProposeForm()) {
                <div class="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <h4 class="mb-3 text-sm font-medium text-blue-700">Proponi nuovo orario</h4>
                  <div class="flex flex-wrap items-end gap-3">
                    <div>
                      <label class="block text-xs text-blue-600 mb-1">Data e ora inizio</label>
                      <input type="datetime-local" [(ngModel)]="propStart" class="rounded border border-blue-200 px-2 py-1.5 text-sm" />
                    </div>
                    <div>
                      <label class="block text-xs text-blue-600 mb-1">Data e ora fine</label>
                      <input type="datetime-local" [(ngModel)]="propEnd" class="rounded border border-blue-200 px-2 py-1.5 text-sm" />
                    </div>
                    <app-button [disabled]="!propStart || !propEnd" [isLoading]="actionLoading()" (click)="proposeNewTime()">Proponi</app-button>
                    <app-button variant="secondary" (click)="showProposeForm.set(false)">Annulla</app-button>
                  </div>
                </div>
              }
            </app-card>
          }
        }

        <!-- Cancel dialog -->
        <app-confirm-dialog
          [open]="cancelDialogOpen()"
          title="Cancella appuntamento"
          message="Sei sicuro di voler cancellare questo appuntamento?"
          confirmLabel="Cancella"
          [isLoading]="actionLoading()"
          (onConfirm)="cancelAppointment()"
          (onCancel)="cancelDialogOpen.set(false)"
        />
      </div>
    </app-page-shell>
  `,
})
export class AppointmentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly aptService = inject(AppointmentService);
  private readonly profService = inject(ProfessionalService);

  readonly apt = signal<AppointmentResponse | null>(null);
  readonly allProfessionals = signal<ProfessionalResponse[]>([]);
  readonly isLoading = signal(true);
  readonly actionLoading = signal(false);
  readonly error = signal('');
  readonly cancelDialogOpen = signal(false);
  readonly showProposeForm = signal(false);
  readonly editMode = signal(false);
  propStart = '';
  propEnd = '';

  // Edit form fields
  editDate = '';
  editStartTime = '';
  editDuration = 30;
  editProfessionalId = '';
  editNotes = '';

  // Edit calendar
  readonly editCalMonth = signal(new Date().getMonth());
  readonly editCalYear = signal(new Date().getFullYear());
  readonly daysOfWeek = DAYS_IT;

  readonly editCalMonthLabel = computed(() => `${MONTHS_IT[this.editCalMonth()]} ${this.editCalYear()}`);

  readonly editCalDays = computed(() => {
    const year = this.editCalYear();
    const month = this.editCalMonth();
    const firstDay = new Date(year, month, 1);
    let dow = firstDay.getDay();
    if (dow === 0) dow = 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const cells: (null | { num: number; dateStr: string; isToday: boolean; isPast: boolean })[] = [];
    for (let i = 1; i < dow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayDate = new Date(year, month, d);
      cells.push({ num: d, dateStr, isToday: dateStr === todayStr, isPast: dayDate < new Date(today.getFullYear(), today.getMonth(), today.getDate()) });
    }
    return cells;
  });

  readonly editEndTimeComputed = computed(() => {
    if (!this.editStartTime) return '';
    const [h, m] = this.editStartTime.split(':').map(Number);
    const totalMin = h * 60 + m + this.editDuration;
    return `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`;
  });

  readonly isEditable = computed(() => {
    const status = this.apt()?.status;
    return status === 'REQUESTED' || status === 'CONFIRMED';
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.aptService.getById(id).subscribe({
      next: (a) => {
        this.apt.set(a);
        this.isLoading.set(false);
      },
      error: () => this.router.navigate(['/appuntamenti']),
    });
    this.profService.list().subscribe({
      next: (list) => this.allProfessionals.set(list.filter((p) => p.active)),
    });
  }

  toggleEditMode(): void {
    const a = this.apt()!;
    const start = new Date(a.startDatetime);
    const end = new Date(a.endDatetime);
    this.editDate = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
    this.editStartTime = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
    this.editDuration = Math.round((end.getTime() - start.getTime()) / 60000);
    this.editProfessionalId = a.professionalId;
    this.editNotes = a.notes ?? '';
    // Set calendar month
    this.editCalMonth.set(start.getMonth());
    this.editCalYear.set(start.getFullYear());
    this.editMode.set(true);
  }

  editCalPrevMonth(): void {
    if (this.editCalMonth() === 0) { this.editCalMonth.set(11); this.editCalYear.update((y) => y - 1); }
    else { this.editCalMonth.update((m) => m - 1); }
  }
  editCalNextMonth(): void {
    if (this.editCalMonth() === 11) { this.editCalMonth.set(0); this.editCalYear.update((y) => y + 1); }
    else { this.editCalMonth.update((m) => m + 1); }
  }

  saveChanges(): void {
    const a = this.apt()!;
    this.actionLoading.set(true);
    this.error.set('');

    const startIso = new Date(`${this.editDate}T${this.editStartTime}:00`).toISOString();
    const endTime = this.editEndTimeComputed();
    const endIso = new Date(`${this.editDate}T${endTime}:00`).toISOString();

    this.aptService.update(a.id, {
      startDatetime: startIso,
      endDatetime: endIso,
      professionalId: this.editProfessionalId !== a.professionalId ? this.editProfessionalId as import('../../core/models/domain.model').UUID : undefined,
      notes: this.editNotes,
    }).subscribe({
      next: (updated) => {
        this.apt.set(updated);
        this.editMode.set(false);
        this.actionLoading.set(false);
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.error.set(getErrorMessage(err));
      },
    });
  }

  confirm(): void { this.doAction(() => this.aptService.confirm(this.apt()!.id)); }
  complete(): void { this.doAction(() => this.aptService.complete(this.apt()!.id)); }
  noShow(): void { this.doAction(() => this.aptService.noShow(this.apt()!.id)); }

  cancelAppointment(): void {
    this.doAction(() => this.aptService.cancel(this.apt()!.id), () => this.cancelDialogOpen.set(false));
  }

  proposeNewTime(): void {
    if (!this.propStart || !this.propEnd) return;
    this.doAction(
      () => this.aptService.proposeNewTime(this.apt()!.id, { proposedStart: this.propStart, proposedEnd: this.propEnd }),
      () => this.showProposeForm.set(false),
    );
  }

  private doAction(action: () => import('rxjs').Observable<AppointmentResponse>, onSuccess?: () => void): void {
    this.actionLoading.set(true);
    this.error.set('');
    action().subscribe({
      next: (updated) => {
        this.apt.set(updated);
        this.actionLoading.set(false);
        onSuccess?.();
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.error.set(getErrorMessage(err));
      },
    });
  }

  statusLabel(status: AppointmentStatus): string {
    const map: Record<string, string> = { REQUESTED: 'Da confermare', CONFIRMED: 'Confermato', PROPOSED_NEW_TIME: 'Proposta orario', CANCELLED: 'Cancellato', COMPLETED: 'Completato', NO_SHOW: 'Non presentato' };
    return map[status] ?? status;
  }

  statusVariant(status: AppointmentStatus): 'amber' | 'green' | 'blue' | 'red' | 'gray' | 'purple' {
    const map: Record<string, 'amber' | 'green' | 'blue' | 'red' | 'gray' | 'purple'> = { REQUESTED: 'amber', CONFIRMED: 'green', PROPOSED_NEW_TIME: 'blue', CANCELLED: 'red', COMPLETED: 'gray', NO_SHOW: 'purple' };
    return map[status] ?? 'gray';
  }

  cancelledByLabel(val: string): string {
    const map: Record<string, string> = { CLIENT: 'Cliente', PROFESSIONAL: 'Professionista', SYSTEM: 'Sistema' };
    return map[val] ?? val;
  }

  formatFull(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) + ' ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  }
}
