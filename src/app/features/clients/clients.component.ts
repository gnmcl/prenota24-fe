import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ClientService } from '../../core/services/client.service';
import type { ClientSummaryResponse, Page } from '../../core/models/domain.model';
import { getErrorMessage } from '../../shared/utils/errors';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [RouterLink, FormsModule, PageShellComponent, CardComponent, ButtonComponent, EmptyStateComponent],
  template: `
    <app-page-shell>
      <div class="mx-auto max-w-4xl">
        <!-- Header -->
        <div class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">Clienti</h2>
            <p class="text-sm text-gray-500">Gestisci la tua rubrica clienti</p>
          </div>
          <a routerLink="/clienti/nuovo">
            <app-button>+ Nuovo cliente</app-button>
          </a>
        </div>

        <!-- Search -->
        <div class="mb-6">
          <div class="relative">
            <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              type="text"
              [ngModel]="searchQuery()"
              (ngModelChange)="onSearch($event)"
              placeholder="Cerca per nome, email o telefono..."
              class="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
            />
          </div>
        </div>

        <!-- Loading -->
        @if (isLoading()) {
          <div class="flex justify-center py-12">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
          </div>
        }

        <!-- Error -->
        @if (errorMsg()) {
          <app-card extraClass="!bg-red-50 !border-red-200">
            <p class="text-sm text-red-700">{{ errorMsg() }}</p>
          </app-card>
        }

        <!-- Client List -->
        @if (!isLoading() && !errorMsg()) {
          @if (clients().length === 0) {
            <app-empty-state
              icon="👥"
              title="Nessun cliente trovato"
              [description]="searchQuery() ? 'Prova a modificare la ricerca' : 'Aggiungi il tuo primo cliente per iniziare'"
              [actionLabel]="searchQuery() ? '' : '+ Nuovo cliente'"
              (action)="router.navigate(['/clienti/nuovo'])"
            />
          } @else {
            <app-card extraClass="!p-0 overflow-hidden">
              <div class="divide-y divide-gray-100">
                @for (client of clients(); track client.id) {
                  <a [routerLink]="['/clienti', client.id]"
                    class="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer">
                    <div class="flex items-center gap-4">
                      <div class="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                        {{ client.firstName.charAt(0) }}{{ client.lastName.charAt(0) }}
                      </div>
                      <div>
                        <div class="font-medium text-gray-900">{{ client.firstName }} {{ client.lastName }}</div>
                        <div class="text-sm text-gray-500">
                          @if (client.email) {
                            {{ client.email }}
                          }
                          @if (client.email && client.phone) {
                            <span class="mx-1">·</span>
                          }
                          @if (client.phone) {
                            {{ client.phone }}
                          }
                        </div>
                      </div>
                    </div>
                    <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </a>
                }
              </div>
            </app-card>

            <!-- Pagination -->
            @if (totalPages() > 1) {
              <div class="mt-6 flex items-center justify-between">
                <p class="text-sm text-gray-500">{{ totalElements() }} clienti totali</p>
                <div class="flex gap-2">
                  <button (click)="loadPage(currentPage() - 1)" [disabled]="currentPage() === 0"
                    class="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    ← Precedente
                  </button>
                  <span class="flex items-center px-3 text-sm text-gray-500">
                    {{ currentPage() + 1 }} / {{ totalPages() }}
                  </span>
                  <button (click)="loadPage(currentPage() + 1)" [disabled]="currentPage() >= totalPages() - 1"
                    class="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    Successivo →
                  </button>
                </div>
              </div>
            }
          }
        }
      </div>
    </app-page-shell>
  `,
})
export class ClientsComponent implements OnInit {
  readonly router = inject(Router);
  private readonly clientService = inject(ClientService);

  readonly clients = signal<ClientSummaryResponse[]>([]);
  readonly isLoading = signal(true);
  readonly errorMsg = signal('');
  readonly searchQuery = signal('');
  readonly currentPage = signal(0);
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.load();
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentPage.set(0);
      this.load();
    }, 300);
  }

  loadPage(page: number): void {
    this.currentPage.set(page);
    this.load();
  }

  private load(): void {
    this.isLoading.set(true);
    this.errorMsg.set('');
    this.clientService.list(this.searchQuery(), this.currentPage()).subscribe({
      next: (page: Page<ClientSummaryResponse>) => {
        this.clients.set(page.content);
        this.totalPages.set(page.page.totalPages);
        this.totalElements.set(page.page.totalElements);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMsg.set(getErrorMessage(err));
        this.isLoading.set(false);
      },
    });
  }
}
