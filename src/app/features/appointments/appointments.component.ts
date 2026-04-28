import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { AppointmentService } from '../../core/services/appointment.service';
import type { AppointmentResponse, AppointmentStatus, Page } from '../../core/models/domain.model';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [RouterLink, PageShellComponent, CardComponent, ButtonComponent, BadgeComponent, EmptyStateComponent],
  template: `
    <app-page-shell>
      <div class="mx-auto max-w-5xl">
        <!-- Header -->
        <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 class="text-2xl font-bold text-[var(--text-primary)]">Appuntamenti</h2>
            <p class="mt-1 text-sm text-[var(--text-secondary)]">Gestisci tutti gli appuntamenti del tuo studio</p>
          </div>
          <a routerLink="/appuntamenti/nuovo">
            <app-button>
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Nuovo appuntamento
            </app-button>
          </a>
        </div>

        <!-- Filters -->
        <div class="mb-5 flex flex-wrap gap-2">
          @for (filter of statusFilters; track filter.value) {
            <button (click)="setStatusFilter(filter.value)"
              [class]="activeFilter() === filter.value
                ? 'rounded-full bg-[var(--button-primary-bg)] px-4 py-1.5 text-sm font-medium text-[var(--text-inverted)]'
                : 'rounded-full border border-[var(--surface-subtle-border)] bg-[var(--surface-subtle)] px-4 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors'">
              {{ filter.label }}
            </button>
          }
        </div>

        @if (isLoading()) {
          <div class="flex justify-center py-12">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-[var(--surface-card-border)] border-t-[var(--color-primary)]"></div>
          </div>
        } @else if (appointments().length === 0) {
          <app-empty-state
            icon="📅"
            title="Nessun appuntamento"
            [description]="activeFilter() ? 'Nessun appuntamento con questo stato.' : 'Crea il primo appuntamento per iniziare.'"
            actionLabel="Nuovo appuntamento"
            actionRoute="/appuntamenti/nuovo"
          />
        } @else {
          <app-card extraClass="!p-0 overflow-hidden">
            <div class="divide-y divide-[var(--surface-card-border)]">
              @for (apt of appointments(); track apt.id) {
                <a [routerLink]="['/appuntamenti', apt.id]"
                  class="flex items-center gap-4 px-5 py-4 hover:bg-[var(--surface-hover)] transition-colors">
                  <!-- Date badge -->
                  <div class="hidden sm:flex flex-col items-center justify-center rounded-lg bg-[var(--status-accent-bg)] px-3 py-2 text-center shrink-0">
                    <span class="text-xs font-medium text-[var(--status-accent-text)]">{{ monthShort(apt.startDatetime) }}</span>
                    <span class="text-lg font-bold text-[var(--status-accent-text)]">{{ dayNum(apt.startDatetime) }}</span>
                  </div>
                  <!-- Info -->
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <span class="font-medium text-[var(--text-primary)] truncate">{{ apt.clientFullName }}</span>
                      <app-badge [variant]="statusVariant(apt.status)">{{ statusLabel(apt.status) }}</app-badge>
                    </div>
                    <div class="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                      <span>{{ timeRange(apt.startDatetime, apt.endDatetime) }}</span>
                      @if (apt.serviceTypeName) {
                        <span class="text-[var(--text-tertiary)]">·</span>
                        <span>{{ apt.serviceTypeName }}</span>
                      }
                      <span class="text-[var(--text-tertiary)]">·</span>
                      <span>{{ apt.professionalFullName }}</span>
                    </div>
                  </div>
                  <svg class="h-4 w-4 text-[var(--text-tertiary)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </a>
              }
            </div>
          </app-card>

          <!-- Pagination -->
          @if (page().totalPages > 1) {
            <div class="mt-6 flex items-center justify-between">
              <span class="text-sm text-[var(--text-secondary)]">{{ page().totalElements }} risultati</span>
              <div class="flex gap-2">
                <app-button variant="secondary" [disabled]="page().first" (click)="goToPage(page().number - 1)">← Precedente</app-button>
                <app-button variant="secondary" [disabled]="page().last" (click)="goToPage(page().number + 1)">Successiva →</app-button>
              </div>
            </div>
          }
        }
      </div>
    </app-page-shell>
  `,
})
export class AppointmentsComponent implements OnInit {
  private readonly aptService = inject(AppointmentService);

  readonly appointments = signal<AppointmentResponse[]>([]);
  readonly page = signal<Page<AppointmentResponse>>({ content: [], totalElements: 0, totalPages: 0, size: 20, number: 0, first: true, last: true });
  readonly isLoading = signal(true);
  readonly activeFilter = signal<string>('');

  readonly statusFilters = [
    { value: '', label: 'Tutti' },
    { value: 'REQUESTED', label: 'Da confermare' },
    { value: 'CONFIRMED', label: 'Confermati' },
    { value: 'COMPLETED', label: 'Completati' },
    { value: 'CANCELLED', label: 'Cancellati' },
    { value: 'NO_SHOW', label: 'Non presentati' },
  ];

  ngOnInit(): void {
    this.loadAppointments();
  }

  setStatusFilter(status: string): void {
    this.activeFilter.set(status);
    this.loadAppointments(0);
  }

  goToPage(page: number): void {
    this.loadAppointments(page);
  }

  private loadAppointments(pageNum = 0): void {
    this.isLoading.set(true);
    this.aptService.list(pageNum, 20, this.activeFilter() || undefined).subscribe({
      next: (p) => {
        this.page.set(p);
        this.appointments.set(p.content);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
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

  monthShort(iso: string): string {
    return new Date(iso).toLocaleDateString('it-IT', { month: 'short' }).toUpperCase();
  }

  dayNum(iso: string): string {
    return new Date(iso).getDate().toString();
  }

  timeRange(start: string, end: string): string {
    const fmt = (d: Date) => d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    return `${fmt(new Date(start))} – ${fmt(new Date(end))}`;
  }
}
