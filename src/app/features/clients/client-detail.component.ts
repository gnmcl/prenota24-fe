import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { ClientService } from '../../core/services/client.service';
import type {
  ClientResponse,
  ClientNoteResponse,
  AppointmentResponse,
  AppointmentStatus,
} from '../../core/models/domain.model';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, PageShellComponent, CardComponent, ButtonComponent, BadgeComponent, ConfirmDialogComponent],
  template: `
    <app-page-shell>
      <div class="mx-auto max-w-4xl">
        <!-- Back link -->
        <a routerLink="/clienti" class="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Torna alla lista
        </a>

        @if (isLoading()) {
          <div class="flex justify-center py-12">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
          </div>
        }

        @if (client()) {
          <!-- Client Header -->
          <div class="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-700">
                {{ client()!.firstName.charAt(0) }}{{ client()!.lastName.charAt(0) }}
              </div>
              <div>
                <h2 class="text-2xl font-bold text-gray-900">{{ client()!.firstName }} {{ client()!.lastName }}</h2>
                <div class="flex flex-wrap items-center gap-2 mt-1">
                  @if (client()!.email) {
                    <span class="text-sm text-gray-500">{{ client()!.email }}</span>
                  }
                  @if (client()!.phone) {
                    <span class="text-sm text-gray-400">·</span>
                    <span class="text-sm text-gray-500">{{ client()!.phone }}</span>
                  }
                  <app-badge [variant]="sourceVariant(client()!.source)">{{ sourceLabel(client()!.source) }}</app-badge>
                </div>
              </div>
            </div>
            <div class="flex gap-2">
              <a [routerLink]="['/clienti', client()!.id, 'modifica']">
                <app-button variant="secondary">Modifica</app-button>
              </a>
              <app-button variant="danger" (click)="deleteDialogOpen.set(true)">Elimina</app-button>
            </div>
          </div>

          <!-- Tabs -->
          <div class="mb-6 flex gap-1 border-b border-gray-200">
            @for (tab of tabs; track tab.key) {
              <button (click)="activeTab.set(tab.key)"
                [class]="activeTab() === tab.key
                  ? 'border-b-2 border-indigo-600 pb-3 px-4 text-sm font-semibold text-indigo-600'
                  : 'pb-3 px-4 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors'">
                {{ tab.label }}
              </button>
            }
          </div>

          <!-- Tab: Info -->
          @if (activeTab() === 'info') {
            <div class="grid gap-6 sm:grid-cols-2">
              <app-card>
                <h3 class="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Contatto</h3>
                <dl class="space-y-3">
                  <div>
                    <dt class="text-xs text-gray-400">Email</dt>
                    <dd class="text-sm text-gray-900">{{ client()!.email || '—' }}</dd>
                  </div>
                  <div>
                    <dt class="text-xs text-gray-400">Telefono</dt>
                    <dd class="text-sm text-gray-900">{{ client()!.phone || '—' }}</dd>
                  </div>
                  <div>
                    <dt class="text-xs text-gray-400">Cliente dal</dt>
                    <dd class="text-sm text-gray-900">{{ formatDate(client()!.createdAt) }}</dd>
                  </div>
                </dl>
              </app-card>

              <app-card>
                <h3 class="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Dettagli</h3>
                @if (client()!.tags && client()!.tags!.length > 0) {
                  <div class="mb-3">
                    <dt class="text-xs text-gray-400 mb-1">Tag</dt>
                    <div class="flex flex-wrap gap-1">
                      @for (tag of client()!.tags!; track tag) {
                        <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{{ tag }}</span>
                      }
                    </div>
                  </div>
                }
                @if (client()!.notes) {
                  <div>
                    <dt class="text-xs text-gray-400 mb-1">Note generali</dt>
                    <dd class="text-sm text-gray-700 whitespace-pre-line">{{ client()!.notes }}</dd>
                  </div>
                }
                @if (!client()!.tags?.length && !client()!.notes) {
                  <p class="text-sm text-gray-400">Nessun dettaglio aggiuntivo</p>
                }
              </app-card>
            </div>
          }

          <!-- Tab: Notes -->
          @if (activeTab() === 'notes') {
            <app-card>
              <!-- Add note -->
              <div class="mb-6">
                <textarea
                  [(ngModel)]="newNoteContent"
                  placeholder="Scrivi una nota..."
                  rows="3"
                  class="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none resize-none transition-colors"
                ></textarea>
                <div class="mt-2 flex justify-end">
                  <app-button [disabled]="!newNoteContent.trim()" [isLoading]="addingNote()" (click)="addNote()">
                    Aggiungi nota
                  </app-button>
                </div>
              </div>

              <!-- Notes list -->
              @if (notes().length === 0) {
                <p class="py-4 text-center text-sm text-gray-400">Nessuna nota ancora</p>
              } @else {
                <div class="space-y-3">
                  @for (note of notes(); track note.id) {
                    <div class="rounded-lg border border-gray-100 p-4" [class.border-amber-200]="note.pinned" [class.bg-amber-50/50]="note.pinned">
                      <div class="flex items-start justify-between gap-3">
                        <p class="flex-1 text-sm text-gray-700 whitespace-pre-line">{{ note.content }}</p>
                        <div class="flex items-center gap-1 shrink-0">
                          <button (click)="togglePin(note)" title="Fissa/Rimuovi"
                            class="rounded p-1 text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-colors">
                            {{ note.pinned ? '📌' : '📍' }}
                          </button>
                          <button (click)="deleteNote(note)" title="Elimina"
                            class="rounded p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                            🗑️
                          </button>
                        </div>
                      </div>
                      <div class="mt-2 flex items-center gap-2 text-xs text-gray-400">
                        <span>{{ formatDate(note.createdAt) }}</span>
                        @if (note.authorName) {
                          <span>·</span>
                          <span>{{ note.authorName }}</span>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </app-card>
          }

          <!-- Tab: Appointments -->
          @if (activeTab() === 'appointments') {
            @if (appointments().length === 0) {
              <app-card>
                <p class="py-4 text-center text-sm text-gray-400">Nessun appuntamento per questo cliente</p>
              </app-card>
            } @else {
              <app-card extraClass="!p-0 overflow-hidden">
                <div class="divide-y divide-gray-100">
                  @for (apt of appointments(); track apt.id) {
                    <a [routerLink]="['/appuntamenti', apt.id]"
                      class="flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2">
                          <span class="font-medium text-gray-900 truncate">{{ apt.serviceTypeName || 'Appuntamento' }}</span>
                          <app-badge [variant]="appointmentStatusVariant(apt.status)">{{ appointmentStatusLabel(apt.status) }}</app-badge>
                        </div>
                        <div class="mt-0.5 text-sm text-gray-500">
                          {{ formatDateTime(apt.startDatetime) }} · {{ apt.professionalFullName }}
                        </div>
                      </div>
                      <svg class="h-4 w-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                      </svg>
                    </a>
                  }
                </div>
              </app-card>
            }
          }
        }

        <!-- Delete Dialog -->
        <app-confirm-dialog
          [open]="deleteDialogOpen()"
          title="Elimina cliente"
          message="Sei sicuro di voler eliminare questo cliente? L'azione è irreversibile."
          confirmLabel="Elimina"
          [isLoading]="isDeleting()"
          (onConfirm)="deleteClient()"
          (onCancel)="deleteDialogOpen.set(false)"
        />
      </div>
    </app-page-shell>
  `,
})
export class ClientDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly clientService = inject(ClientService);

  readonly client = signal<ClientResponse | null>(null);
  readonly notes = signal<ClientNoteResponse[]>([]);
  readonly appointments = signal<AppointmentResponse[]>([]);
  readonly isLoading = signal(true);
  readonly activeTab = signal<'info' | 'notes' | 'appointments'>('info');
  readonly deleteDialogOpen = signal(false);
  readonly isDeleting = signal(false);
  readonly addingNote = signal(false);
  newNoteContent = '';

  readonly tabs = [
    { key: 'info' as const, label: 'Informazioni' },
    { key: 'notes' as const, label: 'Note' },
    { key: 'appointments' as const, label: 'Appuntamenti' },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.clientService.getById(id).subscribe({
      next: (c) => {
        this.client.set(c);
        this.isLoading.set(false);
      },
      error: () => this.router.navigate(['/clienti']),
    });
    this.clientService.getNotes(id).subscribe({ next: (n) => this.notes.set(n) });
    this.clientService.getAppointments(id).subscribe({ next: (a) => this.appointments.set(a) });
  }

  addNote(): void {
    if (!this.newNoteContent.trim()) return;
    this.addingNote.set(true);
    this.clientService.addNote(this.client()!.id, { content: this.newNoteContent.trim() }).subscribe({
      next: (note) => {
        this.notes.update((list) => [note, ...list]);
        this.newNoteContent = '';
        this.addingNote.set(false);
      },
      error: () => this.addingNote.set(false),
    });
  }

  togglePin(note: ClientNoteResponse): void {
    this.clientService.togglePin(this.client()!.id, note.id).subscribe({
      next: (updated) => this.notes.update((list) =>
        list.map((n) => (n.id === updated.id ? updated : n)).sort((a, b) => (a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1)),
      ),
    });
  }

  deleteNote(note: ClientNoteResponse): void {
    this.clientService.deleteNote(this.client()!.id, note.id).subscribe({
      next: () => this.notes.update((list) => list.filter((n) => n.id !== note.id)),
    });
  }

  deleteClient(): void {
    this.isDeleting.set(true);
    this.clientService.delete(this.client()!.id).subscribe({
      next: () => this.router.navigate(['/clienti']),
      error: () => this.isDeleting.set(false),
    });
  }

  sourceLabel(source: string): string {
    const map: Record<string, string> = { MANUAL: 'Manuale', RESERVATION_IMPORT: 'Da evento', PUBLIC_BOOKING: 'Booking online', API: 'API' };
    return map[source] ?? source;
  }

  sourceVariant(source: string): 'indigo' | 'green' | 'purple' | 'gray' {
    const map: Record<string, 'indigo' | 'green' | 'purple' | 'gray'> = { MANUAL: 'gray', RESERVATION_IMPORT: 'purple', PUBLIC_BOOKING: 'green', API: 'indigo' };
    return map[source] ?? 'gray';
  }

  appointmentStatusLabel(status: AppointmentStatus): string {
    const map: Record<string, string> = { REQUESTED: 'Da confermare', CONFIRMED: 'Confermato', PROPOSED_NEW_TIME: 'Proposta orario', CANCELLED: 'Cancellato', COMPLETED: 'Completato', NO_SHOW: 'Non presentato' };
    return map[status] ?? status;
  }

  appointmentStatusVariant(status: AppointmentStatus): 'amber' | 'green' | 'blue' | 'red' | 'gray' | 'purple' {
    const map: Record<string, 'amber' | 'green' | 'blue' | 'red' | 'gray' | 'purple'> = { REQUESTED: 'amber', CONFIRMED: 'green', PROPOSED_NEW_TIME: 'blue', CANCELLED: 'red', COMPLETED: 'gray', NO_SHOW: 'purple' };
    return map[status] ?? 'gray';
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatDateTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  }
}
