import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { AppointmentResponse, AppointmentStatus } from '../../core/models/domain.model';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-appointment-context-panel',
  standalone: true,
  imports: [RouterLink, BadgeComponent, ButtonComponent],
  template: `
    <section class="bg-[var(--surface-card)]" aria-label="Dettaglio appuntamento selezionato">
      <div class="flex items-start justify-between gap-4 border-b border-[var(--surface-card-border)] px-4 py-2.5">
        <div>
          <h3 class="text-sm font-semibold text-[var(--text-primary)]">Dettaglio appuntamento</h3>
          <p class="mt-0.5 text-xs text-[var(--text-tertiary)]">Contesto attivo</p>
        </div>
        <app-badge [variant]="statusVariant(appointment().status)">{{ statusLabel(appointment().status) }}</app-badge>
      </div>

      <div class="px-4 py-3">
        <div class="border-b border-[var(--surface-card-border)] pb-3">
          <p class="text-base font-semibold tracking-[-0.025em] text-[var(--text-primary)]">{{ appointment().clientFullName }}</p>
          <p class="mt-1 text-sm text-[var(--text-secondary)]">{{ appointment().serviceTypeName || 'Servizio non specificato' }}</p>
        </div>

        <dl class="grid grid-cols-2 gap-x-4 gap-y-3 py-3">
          <div>
            <dt class="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Orario</dt>
            <dd class="mt-1 text-sm font-semibold tabular-nums text-[var(--text-primary)]">{{ formatTime(appointment().startDatetime) }}–{{ formatTime(appointment().endDatetime) }}</dd>
          </div>
          <div>
            <dt class="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Durata</dt>
            <dd class="mt-1 text-sm tabular-nums text-[var(--text-primary)]">{{ durationMinutes() }} min</dd>
          </div>
          <div class="col-span-2">
            <dt class="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Professionista</dt>
            <dd class="mt-1 text-sm text-[var(--text-primary)]">{{ appointment().professionalFullName }}</dd>
          </div>
          @if (appointment().notes) {
            <div class="col-span-2">
              <dt class="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Note</dt>
              <dd class="mt-1 text-sm leading-5 text-[var(--text-secondary)]">{{ appointment().notes }}</dd>
            </div>
          }
        </dl>

        <div class="flex flex-col gap-2 border-t border-[var(--surface-card-border)] pt-3 sm:flex-row lg:flex-col">
          @if (appointment().status === 'REQUESTED') {
            <app-button size="sm" [isLoading]="isConfirming()" (click)="confirm.emit(appointment())" extraClass="w-full">Conferma prenotazione</app-button>
          }
          <a [routerLink]="['/appuntamenti', appointment().id]" class="block w-full">
            <app-button variant="secondary" size="sm" extraClass="w-full">Apri scheda completa</app-button>
          </a>
        </div>
      </div>
    </section>
  `,
})
export class AppointmentContextPanelComponent {
  readonly appointment = input.required<AppointmentResponse>();
  readonly isConfirming = input(false);
  readonly confirm = output<AppointmentResponse>();

  durationMinutes(): number {
    return Math.max(0, Math.round((new Date(this.appointment().endDatetime).getTime() - new Date(this.appointment().startDatetime).getTime()) / 60_000));
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  }

  statusLabel(status: AppointmentStatus): string {
    const map: Record<AppointmentStatus, string> = {
      REQUESTED: 'Da confermare',
      CONFIRMED: 'Confermato',
      PROPOSED_NEW_TIME: 'Proposta',
      CANCELLED: 'Cancellato',
      COMPLETED: 'Completato',
      NO_SHOW: 'Non presentato',
    };
    return map[status];
  }

  statusVariant(status: AppointmentStatus): 'amber' | 'green' | 'blue' | 'red' | 'gray' | 'purple' {
    const map: Record<AppointmentStatus, 'amber' | 'green' | 'blue' | 'red' | 'gray' | 'purple'> = {
      REQUESTED: 'amber',
      CONFIRMED: 'green',
      PROPOSED_NEW_TIME: 'blue',
      CANCELLED: 'red',
      COMPLETED: 'gray',
      NO_SHOW: 'purple',
    };
    return map[status];
  }
}
