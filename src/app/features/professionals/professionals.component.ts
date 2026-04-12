import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ProfessionalService } from '../../core/services/professional.service';
import type { ProfessionalResponse } from '../../core/models/domain.model';

@Component({
  selector: 'app-professionals',
  standalone: true,
  imports: [RouterLink, PageShellComponent, CardComponent, ButtonComponent, BadgeComponent, EmptyStateComponent],
  template: `
    <app-page-shell>
      <div class="mx-auto max-w-4xl">
        <!-- Header -->
        <div class="mb-6 flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">Team</h2>
            <p class="mt-1 text-sm text-gray-500">Gestisci i professionisti del tuo studio</p>
          </div>
          <a routerLink="/professionisti/nuovo">
            <app-button>
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Aggiungi
            </app-button>
          </a>
        </div>

        @if (isLoading()) {
          <div class="flex justify-center py-12">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
          </div>
        } @else if (professionals().length === 0) {
          <app-empty-state
            icon="👤"
            title="Nessun professionista"
            description="Aggiungi il primo membro del team per iniziare a gestire appuntamenti."
            actionLabel="Aggiungi professionista"
            actionRoute="/professionisti/nuovo"
          />
        } @else {
          <div class="grid gap-4 sm:grid-cols-2">
            @for (pro of professionals(); track pro.id) {
              <a [routerLink]="['/professionisti', pro.id]" class="block">
                <app-card extraClass="hover:shadow-md transition-shadow !p-5">
                  <div class="flex items-center gap-3">
                    <div class="flex h-11 w-11 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                      {{ pro.firstName.charAt(0) }}{{ pro.lastName.charAt(0) }}
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2">
                        <span class="font-semibold text-gray-900 truncate">{{ pro.firstName }} {{ pro.lastName }}</span>
                        <app-badge [variant]="pro.active ? 'green' : 'gray'">{{ pro.active ? 'Attivo' : 'Inattivo' }}</app-badge>
                      </div>
                      <p class="text-sm text-gray-500 truncate">{{ pro.email || pro.phone || 'Nessun contatto' }}</p>
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
export class ProfessionalsComponent implements OnInit {
  private readonly profService = inject(ProfessionalService);

  readonly professionals = signal<ProfessionalResponse[]>([]);
  readonly isLoading = signal(true);

  ngOnInit(): void {
    this.profService.list().subscribe({
      next: (list) => {
        this.professionals.set(list);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }
}
