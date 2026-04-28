import { Component, inject, OnInit, signal } from '@angular/core';
import { ProfessionalPortalService } from '../../core/services/professional-portal.service';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { CardComponent } from '../../shared/components/card/card.component';
import type { ProfessionalDashboardResponse } from '../../core/models/domain.model';

@Component({
  selector: 'app-professional-profile',
  standalone: true,
  imports: [PageShellComponent, CardComponent],
  template: `
    <app-page-shell>
      <div class="mx-auto max-w-3xl">
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-gray-900">Il Tuo Profilo</h2>
          <p class="text-sm text-gray-500">I tuoi dati personali e di contatto</p>
        </div>

        <app-card>
          @if (isLoading()) {
            <div class="flex justify-center py-12">
              <div class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
            </div>
          } @else if (profile()) {
            <div class="space-y-6">
              <div class="flex items-center gap-4 border-b border-gray-100 pb-6">
                <div class="flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-xl font-bold text-violet-700">
                  {{ profile()!.professional.firstName[0] }}{{ profile()!.professional.lastName[0] }}
                </div>
                <div>
                  <h3 class="text-lg font-medium text-gray-900">{{ profile()!.professional.firstName }} {{ profile()!.professional.lastName }}</h3>
                  <p class="text-sm text-gray-500">Membro del team: {{ profile()!.studio.name }}</p>
                </div>
              </div>

              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <dt class="text-sm font-medium text-gray-500">Email di contatto</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ profile()!.professional.email }}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500">Telefono</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ profile()!.professional.phone || 'Non specificato' }}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500">Stato Account</dt>
                  <dd class="mt-1 text-sm">
                    @if (profile()!.professional.active) {
                      <span class="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">Attivo</span>
                    } @else {
                      <span class="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">Inattivo</span>
                    }
                  </dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500">Data iscrizione</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ formatDate(profile()!.professional.createdAt) }}</dd>
                </div>
              </div>
            </div>
          }
        </app-card>
      </div>
    </app-page-shell>
  `,
})
export class ProfessionalProfileComponent implements OnInit {
  private readonly portalService = inject(ProfessionalPortalService);

  readonly isLoading = signal(true);
  readonly profile = signal<ProfessionalDashboardResponse | null>(null);

  ngOnInit(): void {
    // using getDashboard as it returns the professional profile info
    this.portalService.getDashboard().subscribe({
      next: (data) => {
        this.profile.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  }
}
