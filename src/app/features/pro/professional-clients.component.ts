import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ProfessionalPortalService } from '../../core/services/professional-portal.service';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { FormsModule } from '@angular/forms';
import type { ClientSummaryResponse, CreateClientRequest } from '../../core/models/domain.model';

@Component({
  selector: 'app-professional-clients',
  standalone: true,
  imports: [PageShellComponent, CardComponent, ButtonComponent, FormsModule],
  template: `
    <app-page-shell>
      <div class="mx-auto max-w-5xl">
        <div class="mb-8 flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">Clienti</h2>
            <p class="text-sm text-gray-500">I clienti che hai seguito o con cui hai appuntamenti</p>
          </div>
          <app-button (click)="showForm.set(true)" [disabled]="showForm()">+ Nuovo cliente</app-button>
        </div>

        <!-- Inline creation form -->
        @if (showForm()) {
          <app-card class="mb-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Nuovo cliente</h3>
            @if (formError()) {
              <div class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ formError() }}</div>
            }
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input type="text" [(ngModel)]="form.firstName" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Cognome *</label>
                <input type="text" [(ngModel)]="form.lastName" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" [(ngModel)]="form.email" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                <input type="tel" [(ngModel)]="form.phone" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
              </div>
            </div>
            <div class="mt-4 flex items-center gap-3">
              <app-button [isLoading]="saving()" [disabled]="!form.firstName.trim() || !form.lastName.trim()" (click)="saveClient()">Crea cliente</app-button>
              <button (click)="cancelForm()" class="text-sm text-gray-500 hover:text-gray-700 font-medium">Annulla</button>
            </div>
          </app-card>
        }

        <app-card>
          @if (isLoading()) {
            <div class="flex justify-center py-12">
              <div class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
            </div>
          } @else if (clients().length === 0) {
            <div class="text-center py-12">
              <span class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-4">
                <svg class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </span>
              <h3 class="text-sm font-medium text-gray-900">Nessun cliente</h3>
              <p class="mt-1 text-sm text-gray-500">I clienti compariranno qui quando ti verranno assegnati appuntamenti.</p>
            </div>
          } @else {
            <div class="-mx-4 -my-4 sm:-mx-6 sm:-my-6">
              <div class="inline-block min-w-full align-middle">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th scope="col" class="py-3 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 sm:pl-6">Nome / Email</th>
                      <th scope="col" class="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Telefono</th>
                      <th scope="col" class="px-3 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500 sm:pr-6">Primo contatto</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 bg-white">
                    @for (client of clients(); track client.id) {
                      <tr>
                        <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <div class="font-medium text-gray-900">{{ client.firstName }} {{ client.lastName }}</div>
                          <div class="text-gray-500">{{ client.email }}</div>
                        </td>
                        <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {{ client.phone || '—' }}
                        </td>
                        <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right sm:pr-6">
                           {{ formatDate(client.createdAt) }}
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
        </app-card>
      </div>
    </app-page-shell>
  `,
})
export class ProfessionalClientsComponent implements OnInit {
  private readonly portalService = inject(ProfessionalPortalService);

  readonly isLoading = signal(true);
  private readonly _clients = signal<ClientSummaryResponse[]>([]);
  readonly clients = computed(() => this._clients());

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
