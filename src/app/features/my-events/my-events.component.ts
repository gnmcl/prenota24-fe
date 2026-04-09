import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { EventService } from '../../core/services/event.service';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import type { EventSummaryResponse } from '../../core/models/domain.model';

@Component({
  selector: 'app-my-events',
  standalone: true,
  imports: [RouterLink, PageShellComponent, CardComponent, ButtonComponent],
  template: `
    <app-page-shell>
      <div class="mx-auto max-w-2xl">
        <div class="mb-8 flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">I tuoi eventi</h2>
            <p class="text-sm text-gray-500">Gestisci e monitora le prenotazioni</p>
          </div>
          <a routerLink="/eventi/nuovo"><app-button>+ Nuovo evento</app-button></a>
        </div>

        @if (isLoading()) {
          <div class="flex justify-center py-12">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
          </div>
        }

        @if (hasError()) {
          <app-card><p class="text-sm text-red-600">Errore nel caricamento degli eventi. Riprova.</p></app-card>
        }

        @if (!isLoading() && !hasError() && events().length === 0) {
          <app-card extraClass="text-center">
            <p class="text-gray-500 mb-4">Non hai ancora creato nessun evento.</p>
            <a routerLink="/eventi/nuovo"><app-button>Crea il tuo primo evento</app-button></a>
          </app-card>
        }

        @if (!isLoading() && !hasError() && events().length > 0) {
          <div class="flex flex-col gap-4">
            @for (event of events(); track event.id) {
              <app-card extraClass="transition-shadow hover:shadow-md">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <h3 class="text-lg font-semibold text-gray-900">{{ event.title }}</h3>
                    <p class="mt-1 text-sm text-gray-500">📅 {{ formatDate(event.eventDate) }} • 🕐 {{ formatTime(event.startTime) }} – {{ formatTime(event.endTime) }}</p>
                    @if (event.location) {
                      <p class="mt-0.5 text-sm text-gray-500">📍 {{ event.location }}</p>
                    }
                  </div>
                  <span [class]="'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ' + getBadgeClass(event.status)">{{ getBadgeLabel(event.status) }}</span>
                </div>
                <div class="mt-4 flex items-center justify-between">
                  <span class="text-sm text-gray-600">👥 {{ event.currentParticipants }}{{ event.maxParticipants ? ' / ' + event.maxParticipants : '' }} prenotati</span>
                  <div class="flex gap-2">
                    <app-button variant="secondary" (click)="copyLink(event)" extraClass="!px-3 !py-1.5 !text-xs">📋 Copia link</app-button>
                    <app-button (click)="router.navigate(['/eventi', event.id])" extraClass="!px-3 !py-1.5 !text-xs">Gestisci →</app-button>
                  </div>
                </div>
              </app-card>
            }
          </div>
        }
      </div>
    </app-page-shell>
  `,
})
export class MyEventsComponent implements OnInit {
  readonly router = inject(Router);
  private readonly eventService = inject(EventService);

  // Use signals for reliable change detection
  readonly events = signal<EventSummaryResponse[]>([]);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);

  ngOnInit(): void {
    this.eventService.getMyEvents().subscribe({
      next: (data) => {
        this.events.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('[MyEvents] Error loading events:', err);
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('it-IT', {
      weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  formatTime(timeStr: string): string {
    return timeStr?.slice(0, 5) ?? '';
  }

  getBadgeClass(status: string): string {
    const m: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-700',
      PUBLISHED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700',
      COMPLETED: 'bg-blue-100 text-blue-700',
    };
    return m[status] ?? m['DRAFT'];
  }

  getBadgeLabel(status: string): string {
    const m: Record<string, string> = {
      DRAFT: 'Bozza',
      PUBLISHED: 'Pubblicato',
      CANCELLED: 'Cancellato',
      COMPLETED: 'Completato',
    };
    return m[status] ?? 'Bozza';
  }

  copyLink(event: EventSummaryResponse): void {
    const url = `${window.location.origin}/e/${event.slug}`;
    navigator.clipboard.writeText(url);
  }
}
