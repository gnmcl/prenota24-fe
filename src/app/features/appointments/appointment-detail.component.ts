import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { AppointmentService } from '../../core/services/appointment.service';
import type { AppointmentResponse, AppointmentStatus } from '../../core/models/domain.model';
import { getErrorMessage } from '../../shared/utils/errors';

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
              <div class="flex items-center gap-3">
                <h2 class="text-2xl font-bold text-gray-900">Appuntamento</h2>
                <app-badge [variant]="statusVariant(apt()!.status)">{{ statusLabel(apt()!.status) }}</app-badge>
              </div>
              <p class="mt-1 text-sm text-gray-500">{{ formatFull(apt()!.startDatetime) }} — {{ formatTime(apt()!.endDatetime) }}</p>
            </div>
          </div>

          <!-- Details grid -->
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

  readonly apt = signal<AppointmentResponse | null>(null);
  readonly isLoading = signal(true);
  readonly actionLoading = signal(false);
  readonly error = signal('');
  readonly cancelDialogOpen = signal(false);
  readonly showProposeForm = signal(false);
  propStart = '';
  propEnd = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.aptService.getById(id).subscribe({
      next: (a) => {
        this.apt.set(a);
        this.isLoading.set(false);
      },
      error: () => this.router.navigate(['/appuntamenti']),
    });
  }

  confirm(): void {
    this.doAction(() => this.aptService.confirm(this.apt()!.id));
  }

  complete(): void {
    this.doAction(() => this.aptService.complete(this.apt()!.id));
  }

  noShow(): void {
    this.doAction(() => this.aptService.noShow(this.apt()!.id));
  }

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
