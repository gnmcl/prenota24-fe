import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { EventService } from '../../core/services/event.service';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import type { EventSummaryResponse } from '../../core/models/domain.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, PageShellComponent, CardComponent, ButtonComponent],
  template: `
    <app-page-shell>
      <div class="mx-auto max-w-3xl">
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-gray-900">
            Benvenuto{{ authService.user()?.name ? ', ' + authService.user()!.name : '' }}! 👋
          </h2>
          <p class="text-gray-500">Ecco un riepilogo dei tuoi eventi</p>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-3 gap-4 mb-8">
          <app-card extraClass="text-center !p-5">
            <div class="text-3xl font-bold text-indigo-600">{{ totalEvents() }}</div>
            <div class="text-xs text-gray-500 mt-1">Eventi totali</div>
          </app-card>
          <app-card extraClass="text-center !p-5">
            <div class="text-3xl font-bold text-green-600">{{ publishedCount() }}</div>
            <div class="text-xs text-gray-500 mt-1">Pubblicati</div>
          </app-card>
          <app-card extraClass="text-center !p-5">
            <div class="text-3xl font-bold text-purple-600">{{ totalReservations() }}</div>
            <div class="text-xs text-gray-500 mt-1">Prenotazioni totali</div>
          </app-card>
        </div>

        <!-- Quick Actions -->
        <app-card extraClass="mb-8">
          <h3 class="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Azioni rapide</h3>
          <div class="flex flex-wrap gap-3">
            <a routerLink="/eventi/nuovo"><app-button>+ Crea nuovo evento</app-button></a>
            <a routerLink="/eventi"><app-button variant="secondary">📋 I tuoi eventi</app-button></a>
          </div>
        </app-card>

        <!-- Recent Events -->
        @if (isLoading()) {
          <div class="flex justify-center py-6">
            <div class="h-6 w-6 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
          </div>
        }

        @if (!isLoading() && recentEvents().length > 0) {
          <app-card>
            <h3 class="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Eventi recenti</h3>
            <div class="space-y-3">
              @for (event of recentEvents(); track event.id) {
                <a [routerLink]="['/eventi', event.id]" class="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors">
                  <div>
                    <span class="font-medium text-gray-900">{{ event.title }}</span>
                    <span class="ml-2 text-sm text-gray-400">👥 {{ event.currentParticipants }}{{ event.maxParticipants ? '/' + event.maxParticipants : '' }}</span>
                  </div>
                  <span class="text-sm text-gray-400">→</span>
                </a>
              }
            </div>
            @if (totalEvents() > 3) {
              <a routerLink="/eventi" class="mt-3 block text-center text-sm text-indigo-600 hover:text-indigo-500 font-medium">Vedi tutti gli eventi →</a>
            }
          </app-card>
        }

        @if (!isLoading() && recentEvents().length === 0) {
          <app-card extraClass="text-center">
            <p class="text-gray-500 mb-4">Non hai ancora creato nessun evento.</p>
            <a routerLink="/eventi/nuovo"><app-button>Crea il tuo primo evento 🚀</app-button></a>
          </app-card>
        }
      </div>
    </app-page-shell>
  `,
})
export class DashboardComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly eventService = inject(EventService);

  private readonly _events = signal<EventSummaryResponse[]>([]);
  readonly isLoading = signal(true);

  readonly recentEvents = computed(() => this._events().slice(0, 3));
  readonly totalEvents = computed(() => this._events().length);
  readonly totalReservations = computed(() => this._events().reduce((sum, e) => sum + e.currentParticipants, 0));
  readonly publishedCount = computed(() => this._events().filter(e => e.status === 'PUBLISHED').length);

  ngOnInit(): void {
    this.eventService.getMyEvents().subscribe({
      next: (data) => {
        this._events.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('[Dashboard] Error:', err);
        this.isLoading.set(false);
      },
    });
  }
}
