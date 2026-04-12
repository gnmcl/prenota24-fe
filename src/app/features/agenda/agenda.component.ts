import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { AppointmentService } from '../../core/services/appointment.service';
import type { AppointmentResponse, AppointmentStatus } from '../../core/models/domain.model';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [RouterLink, PageShellComponent, CardComponent, ButtonComponent, BadgeComponent],
  template: `
    <app-page-shell>
      <div class="mx-auto max-w-4xl">
        <div class="mb-6 flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">Agenda</h2>
            <p class="mt-1 text-sm text-gray-500">I tuoi appuntamenti</p>
          </div>
        </div>

        <!-- Date navigation -->
        <div class="mb-6 flex items-center gap-4">
          <app-button variant="secondary" (click)="prevDay()">←</app-button>
          <div class="text-center flex-1">
            <h3 class="text-lg font-semibold text-gray-900">{{ dateLabel() }}</h3>
            @if (isToday()) {
              <span class="text-xs text-indigo-600 font-medium">Oggi</span>
            }
          </div>
          <app-button variant="secondary" (click)="nextDay()">→</app-button>
        </div>

        <!-- Day quick nav -->
        <div class="mb-6 grid grid-cols-7 gap-1">
          @for (d of weekDays(); track d.date) {
            <button (click)="goToDate(d.date)"
              [class]="d.date === currentDate()
                ? 'rounded-lg bg-indigo-600 px-2 py-2 text-center text-white'
                : 'rounded-lg border border-gray-200 px-2 py-2 text-center text-gray-700 hover:bg-gray-50 transition-colors'">
              <div class="text-xs">{{ d.dayLabel }}</div>
              <div class="text-sm font-semibold">{{ d.dayNum }}</div>
            </button>
          }
        </div>

        @if (isLoading()) {
          <div class="flex justify-center py-12">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
          </div>
        } @else if (dayAppointments().length === 0) {
          <app-card extraClass="text-center">
            <p class="text-gray-400 mb-2">Nessun appuntamento per questa giornata</p>
            <a routerLink="/appuntamenti/nuovo">
              <app-button variant="secondary">+ Nuovo appuntamento</app-button>
            </a>
          </app-card>
        } @else {
          <div class="space-y-3">
            @for (apt of dayAppointments(); track apt.id) {
              <a [routerLink]="['/appuntamenti', apt.id]">
                <app-card extraClass="hover:shadow-md transition-shadow !p-5">
                  <div class="flex items-center gap-4">
                    <div class="flex flex-col items-center rounded-lg bg-indigo-50 px-3 py-2 text-center shrink-0">
                      <span class="text-lg font-bold text-indigo-700">{{ formatTime(apt.startDatetime) }}</span>
                      <span class="text-xs text-indigo-500">{{ formatTime(apt.endDatetime) }}</span>
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2">
                        <span class="font-semibold text-gray-900 truncate">{{ apt.clientFullName }}</span>
                        <app-badge [variant]="statusVariant(apt.status)">{{ statusLabel(apt.status) }}</app-badge>
                      </div>
                      <div class="mt-0.5 text-sm text-gray-500">
                        @if (apt.serviceTypeName) {
                          {{ apt.serviceTypeName }} ·
                        }
                        {{ apt.professionalFullName }}
                      </div>
                    </div>
                    <svg class="h-4 w-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </app-card>
              </a>
            }
          </div>
        }
      </div>
    </app-page-shell>
  `,
})
export class AgendaComponent implements OnInit {
  private readonly aptService = inject(AppointmentService);

  readonly currentDate = signal(this.toDateStr(new Date()));
  readonly allAppointments = signal<AppointmentResponse[]>([]);
  readonly isLoading = signal(true);

  readonly dayAppointments = computed(() => {
    const d = this.currentDate();
    return this.allAppointments()
      .filter((a) => a.startDatetime.startsWith(d))
      .sort((a, b) => a.startDatetime.localeCompare(b.startDatetime));
  });

  readonly dateLabel = computed(() => {
    const d = new Date(this.currentDate() + 'T00:00:00');
    return d.toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  });

  readonly isToday = computed(() => this.currentDate() === this.toDateStr(new Date()));

  readonly weekDays = computed(() => {
    const cur = new Date(this.currentDate() + 'T00:00:00');
    const dow = cur.getDay() || 7; // 1=Mon
    const monday = new Date(cur);
    monday.setDate(cur.getDate() - dow + 1);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return {
        date: this.toDateStr(d),
        dayLabel: d.toLocaleDateString('it-IT', { weekday: 'short' }),
        dayNum: d.getDate(),
      };
    });
  });

  ngOnInit(): void {
    this.loadAppointments();
  }

  prevDay(): void {
    this.shiftDate(-1);
  }

  nextDay(): void {
    this.shiftDate(1);
  }

  goToDate(date: string): void {
    this.currentDate.set(date);
    this.loadAppointments();
  }

  private shiftDate(days: number): void {
    const d = new Date(this.currentDate() + 'T00:00:00');
    d.setDate(d.getDate() + days);
    this.currentDate.set(this.toDateStr(d));
    this.loadAppointments();
  }

  private loadAppointments(): void {
    this.isLoading.set(true);
    // Load a broad set; we filter client-side for day
    this.aptService.list(0, 100).subscribe({
      next: (page) => {
        this.allAppointments.set(page.content);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  private toDateStr(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  }

  statusLabel(status: AppointmentStatus): string {
    const map: Record<string, string> = { REQUESTED: 'Da confermare', CONFIRMED: 'Confermato', PROPOSED_NEW_TIME: 'Proposta', CANCELLED: 'Cancellato', COMPLETED: 'Completato', NO_SHOW: 'Non presentato' };
    return map[status] ?? status;
  }

  statusVariant(status: AppointmentStatus): 'amber' | 'green' | 'blue' | 'red' | 'gray' | 'purple' {
    const map: Record<string, 'amber' | 'green' | 'blue' | 'red' | 'gray' | 'purple'> = { REQUESTED: 'amber', CONFIRMED: 'green', PROPOSED_NEW_TIME: 'blue', CANCELLED: 'red', COMPLETED: 'gray', NO_SHOW: 'purple' };
    return map[status] ?? 'gray';
  }
}
