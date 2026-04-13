import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProfessionalPortalService } from '../../core/services/professional-portal.service';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import type { ProfessionalDashboardResponse, AppointmentResponse, AppointmentStatus } from '../../core/models/domain.model';

const HOUR_START = 7;
const HOUR_END = 21;
const SLOT_HEIGHT = 56;

@Component({
  selector: 'app-professional-dashboard',
  standalone: true,
  imports: [RouterLink, PageShellComponent, CardComponent, ButtonComponent, BadgeComponent],
  template: `
    <app-page-shell>
      <div class="mx-auto max-w-5xl">
        <!-- Header -->
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-gray-900">
            Benvenuto{{ authService.user()?.name ? ', ' + authService.user()!.name : '' }}!
          </h2>
          <p class="text-gray-500 mt-1">
            @if (dashboardData()) {
              Studio: <strong class="text-gray-700">{{ dashboardData()!.studio.name }}</strong>
            }
          </p>
        </div>

        @if (isLoading()) {
          <div class="flex justify-center py-20">
            <div class="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
          </div>
        } @else if (hasError()) {
          <app-card extraClass="text-center py-12">
            <svg class="mx-auto h-10 w-10 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
            <p class="text-gray-600 font-medium">Impossibile caricare la dashboard</p>
            <p class="text-sm text-gray-400 mt-1 mb-4">Controlla la connessione o riprova.</p>
            <app-button (click)="loadDashboard()">Riprova</app-button>
          </app-card>
        } @else if (dashboardData()) {
          <!-- Stats -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <app-card extraClass="text-center !py-6">
              <div class="text-4xl font-bold text-indigo-600">{{ dashboardData()!.todayAppointments }}</div>
              <div class="text-sm text-gray-500 mt-1">Appuntamenti oggi</div>
            </app-card>
            <app-card extraClass="text-center !py-6">
              <div class="text-4xl font-bold text-amber-600">{{ dashboardData()!.pendingAppointments }}</div>
              <div class="text-sm text-gray-500 mt-1">Da confermare</div>
            </app-card>
            <app-card extraClass="text-center !py-6">
              <div class="text-4xl font-bold text-green-600">{{ dashboardData()!.totalClients }}</div>
              <div class="text-sm text-gray-500 mt-1">Tuoi clienti</div>
            </app-card>
          </div>

          <!-- Quick links -->
          <div class="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
            <a routerLink="/pro/appuntamenti"
               class="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-center">
              <svg class="h-6 w-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <span class="text-sm font-medium text-gray-700">Appuntamenti</span>
            </a>
            <a routerLink="/pro/clienti"
               class="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-center">
              <svg class="h-6 w-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <span class="text-sm font-medium text-gray-700">Clienti</span>
            </a>
            <a routerLink="/pro/disponibilita"
               class="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-center">
              <svg class="h-6 w-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span class="text-sm font-medium text-gray-700">Disponibilità</span>
            </a>
            <a routerLink="/pro/profilo"
               class="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-center">
              <svg class="h-6 w-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A8.966 8.966 0 0112 15c2.137 0 4.104.745 5.657 1.977M15 10a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <span class="text-sm font-medium text-gray-700">Profilo</span>
            </a>
          </div>

          <!-- Today calendar preview -->
          <app-card>
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-semibold uppercase tracking-wider text-gray-400">Agenda oggi — {{ todayLabel() }}</h3>
              <a routerLink="/pro/appuntamenti" class="text-sm text-indigo-600 hover:text-indigo-500 font-medium">Vedi tutti →</a>
            </div>

            @if (todayAppointments().length === 0) {
              <div class="text-center py-8">
                <p class="text-sm text-gray-400">Nessun appuntamento per oggi 🎉</p>
              </div>
            } @else {
              <div class="space-y-2">
                @for (apt of todayAppointments(); track apt.id) {
                  <div class="flex items-center gap-4 rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors">
                    <div class="flex flex-col items-center rounded-lg shrink-0 min-w-[52px] text-center"
                         [style.background]="aptBg(apt)" [style.border-left]="'3px solid ' + aptBorder(apt)"
                         style="padding: 6px 10px; border-radius: 8px;">
                      <span class="text-sm font-bold text-gray-900">{{ formatTime(apt.startDatetime) }}</span>
                      <span class="text-[10px] text-gray-500">{{ formatTime(apt.endDatetime) }}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="font-medium text-gray-900 truncate">{{ apt.clientFullName }}</span>
                        <app-badge [variant]="statusVariant(apt.status)">{{ statusLabel(apt.status) }}</app-badge>
                      </div>
                      @if (apt.serviceTypeName) {
                        <span class="text-xs text-gray-500">{{ apt.serviceTypeName }}</span>
                      }
                    </div>
                    @if (apt.status === 'REQUESTED') {
                      <button (click)="quickConfirm(apt.id)" class="shrink-0 rounded-md bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors">
                        Conferma
                      </button>
                    }
                  </div>
                }
              </div>
            }
          </app-card>

          <!-- Upcoming (not today) -->
          @if (upcomingAppointments().length > 0) {
            <app-card extraClass="mt-4">
              <h3 class="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Prossimi appuntamenti</h3>
              <div class="space-y-2">
                @for (apt of upcomingAppointments().slice(0, 5); track apt.id) {
                  <div class="flex items-center gap-3 rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors">
                    <div class="shrink-0 text-center min-w-[52px]">
                      <div class="text-xs font-medium text-gray-500">{{ formatDay(apt.startDatetime) }}</div>
                      <div class="text-sm font-bold text-gray-900">{{ formatTime(apt.startDatetime) }}</div>
                    </div>
                    <div class="flex-1 min-w-0">
                      <span class="font-medium text-gray-900 truncate block">{{ apt.clientFullName }}</span>
                      @if (apt.serviceTypeName) {
                        <span class="text-xs text-gray-500">{{ apt.serviceTypeName }}</span>
                      }
                    </div>
                    <app-badge [variant]="statusVariant(apt.status)">{{ statusLabel(apt.status) }}</app-badge>
                  </div>
                }
              </div>
            </app-card>
          }
        }
      </div>
    </app-page-shell>
  `,
})
export class ProfessionalDashboardComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly portalService = inject(ProfessionalPortalService);

  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly dashboardData = signal<ProfessionalDashboardResponse | null>(null);
  private readonly _allAppointments = signal<AppointmentResponse[]>([]);

  readonly todayLabel = () => new Date().toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long' });

  readonly todayAppointments = computed(() => {
    const today = this.localDateStr(new Date());
    return this._allAppointments()
      .filter((a) => a.startDatetime.startsWith(today) && a.status !== 'CANCELLED')
      .sort((a, b) => a.startDatetime.localeCompare(b.startDatetime));
  });

  readonly upcomingAppointments = computed(() => {
    const today = this.localDateStr(new Date());
    return this._allAppointments()
      .filter((a) => a.startDatetime > today + 'T99' && a.status !== 'CANCELLED')
      .sort((a, b) => a.startDatetime.localeCompare(b.startDatetime));
  });

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.portalService.getDashboard().subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.portalService.listAppointments(0, 50).subscribe({
          next: (page) => {
            this._allAppointments.set(page.content);
            this.isLoading.set(false);
          },
          error: () => this.isLoading.set(false),
        });
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  quickConfirm(id: string): void {
    this.portalService.confirmAppointment(id).subscribe({
      next: (updated) => {
        this._allAppointments.update((list) =>
          list.map((a) => (a.id === updated.id ? updated : a))
        );
      },
    });
  }

  aptBg(apt: AppointmentResponse): string {
    return apt.serviceTypeColor ? apt.serviceTypeColor + '20' : '#F3F4F6';
  }

  aptBorder(apt: AppointmentResponse): string {
    return apt.serviceTypeColor || '#9CA3AF';
  }

  statusLabel(status: AppointmentStatus): string {
    const map: Record<string, string> = { REQUESTED: 'Da confermare', CONFIRMED: 'Confermato', PROPOSED_NEW_TIME: 'Proposta', CANCELLED: 'Cancellato', COMPLETED: 'Completato', NO_SHOW: 'Non presentato' };
    return map[status] ?? status;
  }

  statusVariant(status: AppointmentStatus): 'amber' | 'green' | 'blue' | 'red' | 'gray' | 'purple' {
    const map: Record<string, 'amber' | 'green' | 'blue' | 'red' | 'gray' | 'purple'> = { REQUESTED: 'amber', CONFIRMED: 'green', PROPOSED_NEW_TIME: 'blue', CANCELLED: 'red', COMPLETED: 'gray', NO_SHOW: 'purple' };
    return map[status] ?? 'gray';
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  }

  formatDay(iso: string): string {
    return new Date(iso).toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' });
  }

  private localDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
