import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ProfessionalPortalService } from '../../core/services/professional-portal.service';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { FormsModule } from '@angular/forms';
import type { ClientSummaryResponse, CreateClientRequest } from '../../core/models/domain.model';

@Component({
  selector: 'app-professional-clients',
  standalone: true,
  imports: [PageShellComponent, CardComponent, ButtonComponent, EmptyStateComponent, FormsModule],
  template: `
    <app-page-shell>
      <div class="mx-auto max-w-5xl">
        <div class="mb-6 flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-[var(--text-primary)]">Clienti</h2>
            <p class="text-sm text-[var(--text-secondary)]">I clienti che hai seguito o con cui hai appuntamenti</p>
          </div>
          <app-button (click)="showForm.set(true)" [disabled]="showForm()">+ Nuovo cliente</app-button>
        </div>

        <!-- Search -->
        <div class="mb-6">
          <div class="relative">
            <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input type="text" [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)"
              placeholder="Cerca per nome, email o telefono..."
              class="w-full rounded-lg border border-[var(--surface-card-border)] bg-[var(--surface-card)] py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors" />
          </div>
        </div>

        <!-- Inline creation form -->
        @if (showForm()) {
          <app-card class="mb-6">
            <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">Nuovo cliente</h3>
            @if (formError()) {
              <div class="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300">{{ formError() }}</div>
            }
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Nome *</label>
                <input type="text" [(ngModel)]="form.firstName" class="w-full rounded-lg border border-[var(--surface-card-border)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:focus:border-indigo-400" />
              </div>
              <div>
                <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Cognome *</label>
                <input type="text" [(ngModel)]="form.lastName" class="w-full rounded-lg border border-[var(--surface-card-border)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:focus:border-indigo-400" />
              </div>
              <div>
                <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email</label>
                <input type="email" [(ngModel)]="form.email" class="w-full rounded-lg border border-[var(--surface-card-border)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:focus:border-indigo-400" />
              </div>
              <div>
                <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Telefono</label>
                <input type="tel" [(ngModel)]="form.phone" class="w-full rounded-lg border border-[var(--surface-card-border)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:focus:border-indigo-400" />
              </div>
            </div>
            <div class="mt-4 flex items-center gap-3">
              <app-button [isLoading]="saving()" [disabled]="!form.firstName.trim() || !form.lastName.trim()" (click)="saveClient()">Crea cliente</app-button>
              <button (click)="cancelForm()" class="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium">Annulla</button>
            </div>
          </app-card>
        }

        @if (isLoading()) {
          <div class="flex justify-center py-12">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
          </div>
        } @else if (clients().length === 0) {
          <app-empty-state
            icon="👥"
            title="Nessun cliente trovato"
            [description]="searchQuery() ? 'Prova a modificare la ricerca.' : 'I clienti appariranno qui quando verranno associati a un appuntamento.'"
            [actionLabel]="searchQuery() ? '' : '+ Nuovo cliente'"
            (action)="showForm.set(true)"
          />
        } @else {
          <app-card extraClass="!p-0 overflow-hidden">
            <div class="divide-y divide-[var(--surface-card-border)]">
              @for (client of clients(); track client.id) {
                <div class="flex items-center gap-4 px-5 py-4 hover:bg-[var(--surface-hover)] transition-colors">
                  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                    {{ client.firstName.charAt(0) }}{{ client.lastName.charAt(0) }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="font-medium text-[var(--text-primary)]">{{ client.firstName }} {{ client.lastName }}</div>
                    <div class="text-sm text-[var(--text-secondary)]">
                      @if (client.email) { {{ client.email }} }
                      @if (client.email && client.phone) { <span class="mx-1">·</span> }
                      @if (client.phone) { {{ client.phone }} }
                    </div>
                  </div>
                  <div class="text-xs text-[var(--text-tertiary)] shrink-0 hidden sm:block">{{ formatDate(client.createdAt) }}</div>
                </div>
              }
            </div>
          </app-card>
        }
      </div>
    </app-page-shell>
  `,
})
export class ProfessionalClientsComponent implements OnInit {
  private readonly portalService = inject(ProfessionalPortalService);

  readonly isLoading = signal(true);
  private readonly _clients = signal<ClientSummaryResponse[]>([]);
  readonly searchQuery = signal('');
  readonly clients = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const all = this._clients();
    if (!q) return all;
    return all.filter(c =>
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
      (c.email?.toLowerCase().includes(q) ?? false) ||
      (c.phone?.toLowerCase().includes(q) ?? false)
    );
  });

  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly formError = signal('');
  form = { firstName: '', lastName: '', email: '', phone: '' };

  ngOnInit(): void {
    this.portalService.listClients().subscribe({
      next: (list) => {
        this._clients.set(list);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  saveClient(): void {
    this.saving.set(true);
    this.formError.set('');
    const req: CreateClientRequest = {
      firstName: this.form.firstName.trim(),
      lastName: this.form.lastName.trim(),
      email: this.form.email.trim() || undefined,
      phone: this.form.phone.trim() || undefined,
    };
    this.portalService.createClient(req).subscribe({
      next: (client) => {
        this._clients.update((list) => [client, ...list]);
        this.saving.set(false);
        this.cancelForm();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err?.error?.message || 'Errore nella creazione del cliente');
      },
    });
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.formError.set('');
    this.form = { firstName: '', lastName: '', email: '', phone: '' };
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
