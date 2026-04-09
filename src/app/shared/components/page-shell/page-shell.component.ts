import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-page-shell',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <header class="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
        <div class="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <a routerLink="/dashboard" class="flex items-center gap-2">
            <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-black text-white shadow-md shadow-indigo-200">
              P
            </span>
            <span class="text-lg font-bold tracking-tight text-gray-900">
              Prenota<span class="text-indigo-600">24</span>
            </span>
          </a>

          @if (authService.user()) {
            <div class="flex items-center gap-4">
              <a
                routerLink="/eventi"
                class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                I miei eventi
              </a>
              <a
                routerLink="/eventi/nuovo"
                class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                + Nuovo
              </a>
              <div class="h-5 w-px bg-gray-200"></div>
              <span class="text-sm text-gray-500">
                {{ authService.user()!.name || authService.user()!.email }}
              </span>
              <button
                (click)="handleLogout()"
                class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                Esci
              </button>
            </div>
          }
        </div>
      </header>

      <!-- Main Content -->
      <main class="mx-auto max-w-5xl px-6 py-10">
        <ng-content />
      </main>
    </div>
  `,
})
export class PageShellComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  handleLogout(): void {
    this.authService.logout();
    this.router.navigate(['/accedi'], { replaceUrl: true });
  }
}
