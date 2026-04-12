import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { ServiceTypeService } from '../../core/services/service-type.service';
import type { ServiceTypeResponse, CreateServiceTypeRequest } from '../../core/models/domain.model';
import { getErrorMessage } from '../../shared/utils/errors';

const PRESET_COLORS = ['#4F46E5', '#7C3AED', '#059669', '#D97706', '#DC2626', '#2563EB', '#DB2777', '#0891B2'];

@Component({
  selector: 'app-service-types',
  standalone: true,
  imports: [RouterLink, FormsModule, PageShellComponent, CardComponent, ButtonComponent, BadgeComponent, EmptyStateComponent, ConfirmDialogComponent, AlertComponent],
  template: `
    <app-page-shell>
      <div class="mx-auto max-w-4xl">
        <div class="mb-6 flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">Servizi</h2>
            <p class="mt-1 text-sm text-gray-500">Configura i servizi offerti dal tuo studio</p>
          </div>
          <app-button (click)="openForm()">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Nuovo servizio
          </app-button>
        </div>

        @if (error()) {
          <app-alert variant="error" [message]="error()" class="mb-4" />
        }

        @if (isLoading()) {
          <div class="flex justify-center py-12">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
          </div>
        } @else if (services().length === 0 && !showForm()) {
          <app-empty-state
            icon="🛠️"
            title="Nessun servizio"
            description="Crea il primo servizio per categorizzare i tuoi appuntamenti."
            actionLabel="Crea servizio"
            (action)="openForm()"
          />
        } @else {
          <div class="space-y-3">
            @for (svc of services(); track svc.id) {
              <app-card extraClass="!p-5">
                <div class="flex items-center justify-between gap-4">
                  <div class="flex items-center gap-3 min-w-0">
                    <span class="h-4 w-4 rounded-full shrink-0" [style.background-color]="svc.color || '#94A3B8'"></span>
                    <div class="min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="font-semibold text-gray-900 truncate">{{ svc.name }}</span>
                        <app-badge [variant]="svc.active ? 'green' : 'gray'">{{ svc.active ? 'Attivo' : 'Inattivo' }}</app-badge>
                      </div>
                      <div class="flex items-center gap-2 text-sm text-gray-500">
                        <span>{{ svc.durationMinutes }} min</span>
                        @if (svc.price) {
                          <span class="text-gray-300">·</span>
                          <span>€{{ svc.price }}</span>
                        }
                        @if (svc.description) {
                          <span class="text-gray-300">·</span>
                          <span class="truncate">{{ svc.description }}</span>
                        }
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <button (click)="editService(svc)" class="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors">Modifica</button>
                    <button (click)="confirmDelete(svc)" class="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">Elimina</button>
                  </div>
                </div>
              </app-card>
            }
          </div>
        }

        <!-- Create / Edit form (inline) -->
        @if (showForm()) {
          <app-card extraClass="mt-6">
            <h3 class="mb-4 text-lg font-semibold text-gray-900">{{ editingId() ? 'Modifica servizio' : 'Nuovo servizio' }}</h3>
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input type="text" [(ngModel)]="formName" class="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-colors" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Durata (minuti) *</label>
                <input type="number" [(ngModel)]="formDuration" min="5" step="5" class="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-colors" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Prezzo (€)</label>
                <input type="number" [(ngModel)]="formPrice" min="0" step="0.5" class="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-colors" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Colore</label>
                <div class="flex items-center gap-2">
                  @for (c of presetColors; track c) {
                    <button (click)="formColor = c" type="button"
                      class="h-7 w-7 rounded-full border-2 transition-transform"
                      [style.background-color]="c"
                      [class.border-gray-900]="formColor === c"
                      [class.border-transparent]="formColor !== c"
                      [class.scale-110]="formColor === c">
                    </button>
                  }
                </div>
              </div>
              <div class="sm:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                <textarea [(ngModel)]="formDescription" rows="2"
                  class="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none resize-none transition-colors"></textarea>
              </div>
            </div>
            <div class="mt-5 flex justify-end gap-3">
              <app-button variant="secondary" (click)="closeForm()">Annulla</app-button>
              <app-button [disabled]="!formName.trim() || !formDuration" [isLoading]="isSaving()" (click)="saveService()">
                {{ editingId() ? 'Salva' : 'Crea' }}
              </app-button>
            </div>
          </app-card>
        }

        <!-- Delete confirm -->
        <app-confirm-dialog
          [open]="deleteDialogOpen()"
          title="Elimina servizio"
          message="Sei sicuro di voler eliminare questo servizio?"
          confirmLabel="Elimina"
          [isLoading]="isDeleting()"
          (onConfirm)="deleteService()"
          (onCancel)="deleteDialogOpen.set(false)"
        />
      </div>
    </app-page-shell>
  `,
})
export class ServiceTypesComponent implements OnInit {
  private readonly svcService = inject(ServiceTypeService);

  readonly services = signal<ServiceTypeResponse[]>([]);
  readonly isLoading = signal(true);
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly isSaving = signal(false);
  readonly error = signal('');
  readonly deleteDialogOpen = signal(false);
  readonly isDeleting = signal(false);
  readonly presetColors = PRESET_COLORS;

  formName = '';
  formDuration = 30;
  formPrice: number | null = null;
  formColor = PRESET_COLORS[0];
  formDescription = '';
  private deleteTarget: ServiceTypeResponse | null = null;

  ngOnInit(): void {
    this.svcService.list().subscribe({
      next: (list) => {
        this.services.set(list);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  openForm(): void {
    this.resetForm();
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  editService(svc: ServiceTypeResponse): void {
    this.editingId.set(svc.id);
    this.formName = svc.name;
    this.formDuration = svc.durationMinutes;
    this.formPrice = svc.price;
    this.formColor = svc.color || PRESET_COLORS[0];
    this.formDescription = svc.description ?? '';
    this.showForm.set(true);
  }

  saveService(): void {
    if (!this.formName.trim() || !this.formDuration) return;
    this.isSaving.set(true);
    this.error.set('');
    const payload: CreateServiceTypeRequest = {
      name: this.formName.trim(),
      durationMinutes: this.formDuration,
      price: this.formPrice ?? undefined,
      color: this.formColor,
      description: this.formDescription.trim() || undefined,
    };
    const req$ = this.editingId()
      ? this.svcService.update(this.editingId()!, payload)
      : this.svcService.create(payload);
    req$.subscribe({
      next: (saved) => {
        this.services.update((list) => {
          const idx = list.findIndex((s) => s.id === saved.id);
          return idx >= 0 ? list.map((s) => (s.id === saved.id ? saved : s)) : [saved, ...list];
        });
        this.isSaving.set(false);
        this.closeForm();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.error.set(getErrorMessage(err));
      },
    });
  }

  confirmDelete(svc: ServiceTypeResponse): void {
    this.deleteTarget = svc;
    this.deleteDialogOpen.set(true);
  }

  deleteService(): void {
    if (!this.deleteTarget) return;
    this.isDeleting.set(true);
    this.svcService.delete(this.deleteTarget.id).subscribe({
      next: () => {
        this.services.update((list) => list.filter((s) => s.id !== this.deleteTarget!.id));
        this.deleteDialogOpen.set(false);
        this.isDeleting.set(false);
        this.deleteTarget = null;
      },
      error: (err) => {
        this.isDeleting.set(false);
        this.error.set(getErrorMessage(err));
      },
    });
  }

  private resetForm(): void {
    this.formName = '';
    this.formDuration = 30;
    this.formPrice = null;
    this.formColor = PRESET_COLORS[0];
    this.formDescription = '';
    this.editingId.set(null);
  }
}
