import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { EntityListComponent } from '../../shared/components/entity-list/entity-list.component';
import { EntityListRowComponent } from '../../shared/components/entity-list/entity-list-row.component';
import { AppointmentService } from '../../core/services/appointment.service';
import { PendingAppointmentsService } from '../../core/services/pending-appointments.service';
import type { AppointmentResponse, AppointmentStatus, Page } from '../../core/models/domain.model';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [RouterLink, PageShellComponent, ButtonComponent, BadgeComponent, EmptyStateComponent, EntityListComponent, EntityListRowComponent],
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

        <!-- ── Pending section ──────────────────────────────────────── -->
        @if (pendingApts().length > 0) {
          <div class="mb-6 rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-900/15 p-4 sm:p-5">
            <div class="mb-3 flex items-center gap-2">
              <span class="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">{{ pendingApts().length }}</span>
              <h3 class="text-sm font-semibold text-amber-800 dark:text-amber-300">Da confermare</h3>
            </div>
            <div class="flex flex-col gap-2">
              @for (apt of pendingApts(); track apt.id) {
                <div class="flex items-center gap-3 rounded-xl bg-white dark:bg-gray-800/60 px-4 py-3 shadow-sm border border-amber-100 dark:border-amber-800/40">
                  <!-- Date -->
                  <div class="hidden sm:flex flex-col items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1.5 text-center shrink-0 min-w-[44px]">
                    <span class="text-[10px] font-medium text-amber-700 dark:text-amber-400">{{ monthShort(apt.startDatetime) }}</span>
                    <span class="text-base font-bold text-amber-800 dark:text-amber-300 leading-tight">{{ dayNum(apt.startDatetime) }}</span>
                  </div>
                  <!-- Info -->
                  <div class="min-w-0 flex-1">
                    <p class="font-medium text-[var(--text-primary)] truncate">{{ apt.clientFullName }}</p>
                    <p class="text-xs text-[var(--text-secondary)] truncate">
                      <span class="sm:hidden font-bold text-[var(--text-primary)]">{{ dayNum(apt.startDatetime) }} {{ monthShort(apt.startDatetime) }} · </span>
                      {{ timeRange(apt.startDatetime, apt.endDatetime) }}
                      @if (apt.serviceTypeName) { · {{ apt.serviceTypeName }} }
                      · {{ apt.professionalFullName }}
                    </p>
                  </div>
                  <!-- Actions -->
                  <div class="flex items-center gap-2 shrink-0">
                    <a [routerLink]="['/appuntamenti', apt.id]"
                      class="rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">
                      Dettagli
                    </a>
                    <button
                      (click)="confirmPending(apt)"
                      [disabled]="confirmingIds().has(apt.id)"
                      class="rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 px-3 py-1.5 text-xs font-semibold text-white transition-colors flex items-center gap-1.5">
                      @if (confirmingIds().has(apt.id)) {
                        <span class="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white inline-block"></span>
                      } @else {
                        <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                      }
                      Conferma
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Filter bar: single row -->
        <div class="mb-3 flex items-center gap-2">
          <!-- Filters toggle -->
          <button (click)="showFilters.set(!showFilters())"
            class="flex items-center gap-1.5 rounded-lg border border-[var(--surface-card-border)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors">
            <svg class="h-4 w-4 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0014 13.828V20a1 1 0 01-1.447.894l-4-2A1 1 0 018 18v-4.172a1 1 0 00-.293-.707L1.293 6.707A1 1 0 011 6V4z"/>
            </svg>
            Filtri
            @if (activeFilterCount() > 0) {
              <span class="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">{{ activeFilterCount() }}</span>
            }
            <svg class="h-3.5 w-3.5 text-[var(--text-tertiary)] transition-transform" [class.rotate-180]="showFilters()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          <!-- Sort direction -->
          <button (click)="toggleSort()" title="Ordina per data"
            class="ml-auto flex items-center gap-1.5 rounded-lg border border-[var(--surface-card-border)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors shrink-0">
            <svg class="h-3.5 w-3.5 transition-transform" [class.rotate-180]="sortDir() === 'asc'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9M3 12h5m10 4l-4 4m0 0l-4-4m4 4V8"/>
            </svg>
            <span class="hidden sm:inline">{{ sortDir() === 'desc' ? 'Più recenti' : 'Meno recenti' }}</span>
          </button>

          @if (!isLoading() && page().page.totalElements > 0) {
            <span class="text-sm text-[var(--text-tertiary)] shrink-0 hidden sm:inline">
              {{ page().page.totalElements }} ris.
            </span>
          }
        </div>

        <!-- Expandable filter panel -->
        @if (showFilters()) {
          <div class="mb-4 rounded-xl border border-[var(--surface-card-border)] bg-[var(--surface-card)] p-3 flex flex-wrap items-center gap-2">
            <!-- Status -->
            <div class="relative shrink-0">
              <select
                [value]="activeFilter()"
                (change)="setStatusFilter($any($event.target).value)"
                class="appearance-none rounded-lg border border-[var(--surface-card-border)] bg-[var(--surface-hover)] pl-3 pr-7 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors cursor-pointer">
                @for (filter of statusFilters; track filter.value) {
                  <option [value]="filter.value">{{ filter.label }}</option>
                }
              </select>
              <svg class="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </div>

            <span class="text-xs text-[var(--text-tertiary)] hidden sm:inline">Data:</span>
            <input type="date" [value]="filterFrom()" (change)="setFilterFrom($any($event.target).value)"
              title="Da" placeholder="Da"
              class="rounded-lg border border-[var(--surface-card-border)] bg-[var(--surface-hover)] px-2.5 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors min-w-0 w-32" />
            <span class="text-xs text-[var(--text-tertiary)]">—</span>
            <input type="date" [value]="filterTo()" (change)="setFilterTo($any($event.target).value)"
              title="A" placeholder="A"
              class="rounded-lg border border-[var(--surface-card-border)] bg-[var(--surface-hover)] px-2.5 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors min-w-0 w-32" />

            @if (activeFilterCount() > 0) {
              <button (click)="clearAllFilters()" title="Rimuovi tutti i filtri"
                class="ml-auto flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-red-500 transition-colors">
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
                Pulisci
              </button>
            }
          </div>
        }

        @if (!isLoading() && page().page.totalElements > 0) {
          <p class="mb-3 text-xs text-[var(--text-tertiary)] sm:hidden">{{ page().page.totalElements }} risultati</p>
        }

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
          <app-entity-list>
            @for (apt of appointments(); track apt.id) {
              <app-entity-list-row [route]="['/appuntamenti', apt.id]" extraClass="overflow-hidden">
                <!-- Date badge -->
                <div class="hidden sm:flex flex-col items-center justify-center rounded-lg bg-[var(--status-accent-bg)] px-3 py-2 text-center shrink-0">
                  <span class="text-xs font-medium text-[var(--status-accent-text)]">{{ monthShort(apt.startDatetime) }}</span>
                  <span class="text-lg font-bold text-[var(--status-accent-text)]">{{ dayNum(apt.startDatetime) }}</span>
                </div>
                <!-- Info -->
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="font-medium text-[var(--text-primary)] truncate min-w-0">{{ apt.clientFullName }}</span>
                    <span class="shrink-0"><app-badge [variant]="statusVariant(apt.status)">{{ statusLabel(apt.status) }}</app-badge></span>
                  </div>
                  <div class="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                    <span class="sm:hidden font-bold text-xs text-[var(--text-primary)]">{{ dayNum(apt.startDatetime) }} {{ monthShort(apt.startDatetime) }}</span>
                    <span class="sm:hidden text-[var(--text-tertiary)] text-xs">·</span>
                    <span>{{ timeRange(apt.startDatetime, apt.endDatetime) }}</span>
                    @if (apt.serviceTypeName) {
                      <span class="text-[var(--text-tertiary)]">·</span>
                      <span>{{ apt.serviceTypeName }}</span>
                    }
                    <span class="text-[var(--text-tertiary)]">·</span>
                    <span>{{ apt.professionalFullName }}</span>
                  </div>
                </div>
              </app-entity-list-row>
            }
          </app-entity-list>

          <!-- Pagination -->
          @if (page().page.totalPages > 1) {
            <div class="mt-6 flex items-center justify-end gap-2">
              <app-button variant="secondary" [disabled]="page().page.number === 0" (click)="goToPage(page().page.number - 1)">← Precedente</app-button>
              <span class="text-sm text-[var(--text-secondary)] px-2">{{ page().page.number + 1 }} / {{ page().page.totalPages }}</span>
              <app-button variant="secondary" [disabled]="page().page.number >= page().page.totalPages - 1" (click)="goToPage(page().page.number + 1)">Successiva →</app-button>
            </div>
          }
        }
      </div>
    </app-page-shell>
  `,
})
export class AppointmentsComponent implements OnInit {
  private readonly aptService = inject(AppointmentService);
  private readonly pendingService = inject(PendingAppointmentsService);

  readonly appointments = signal<AppointmentResponse[]>([]);
  readonly page = signal<Page<AppointmentResponse>>({ content: [], page: { size: 20, number: 0, totalElements: 0, totalPages: 0 } });
  readonly isLoading = signal(true);
  readonly activeFilter = signal<string>('');
  readonly sortDir = signal<'asc' | 'desc'>('desc');
  readonly filterFrom = signal('');
  readonly filterTo = signal('');
  readonly showFilters = signal(false);

  readonly activeFilterCount = computed(() =>
    (this.activeFilter() ? 1 : 0) + (this.filterFrom() ? 1 : 0) + (this.filterTo() ? 1 : 0)
  );
  readonly pendingApts = signal<AppointmentResponse[]>([]);
  readonly confirmingIds = signal<Set<string>>(new Set());

  readonly statusFilters = [
    { value: '', label: 'Tutti' },
    { value: 'REQUESTED', label: 'Da confermare' },
    { value: 'CONFIRMED', label: 'Confermati' },
    { value: 'COMPLETED', label: 'Completati' },
    { value: 'CANCELLED', label: 'Cancellati' },
    { value: 'NO_SHOW', label: 'Non presentati' },
  ];

  ngOnInit(): void {
    this.loadPendingApts();
    this.loadAppointments();
  }

  setStatusFilter(status: string): void {
    this.activeFilter.set(status);
    this.loadAppointments(0);
  }

  toggleSort(): void {
    this.sortDir.set(this.sortDir() === 'desc' ? 'asc' : 'desc');
    this.loadAppointments(0);
  }

  setFilterFrom(val: string): void {
    this.filterFrom.set(val);
    this.loadAppointments(0);
  }

  setFilterTo(val: string): void {
    this.filterTo.set(val);
    this.loadAppointments(0);
  }

  clearDateFilter(): void {
    this.filterFrom.set('');
    this.filterTo.set('');
    this.loadAppointments(0);
  }

  clearAllFilters(): void {
    this.activeFilter.set('');
    this.filterFrom.set('');
    this.filterTo.set('');
    this.loadAppointments(0);
  }

  goToPage(page: number): void {
    this.loadAppointments(page);
  }

  confirmPending(apt: AppointmentResponse): void {
    // Optimistically add to confirming set
    this.confirmingIds.update(s => new Set([...s, apt.id]));
    this.aptService.confirm(apt.id).subscribe({
      next: (confirmed) => {
        // Remove from pending list
        this.pendingApts.update(list => list.filter(a => a.id !== apt.id));
        // Update badge immediately
        this.pendingService.pendingCount.set(this.pendingApts().length);
        // Update in main list if present (change status)
        this.appointments.update(list =>
          list.map(a => a.id === apt.id ? confirmed : a),
        );
        // Remove from confirming set
        this.confirmingIds.update(s => { const n = new Set(s); n.delete(apt.id); return n; });
      },
      error: () => {
        this.confirmingIds.update(s => { const n = new Set(s); n.delete(apt.id); return n; });
      },
    });
  }

  private loadPendingApts(): void {
    this.aptService.list(0, 50, 'REQUESTED').subscribe({
      next: (p) => {
        this.pendingApts.set(p.content);
        // Sync badge count with the actual fresh count
        this.pendingService.pendingCount.set(p.page.totalElements);
      },
      error: () => {},
    });
  }

  private loadAppointments(pageNum = 0): void {
    this.isLoading.set(true);
    const sortParam = `startDatetime,${this.sortDir()}`;
    this.aptService.list(pageNum, 20, this.activeFilter() || undefined, undefined, this.filterFrom() || undefined, this.filterTo() || undefined, sortParam).subscribe({
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
