import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-page-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <header class="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
        <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div class="flex items-center gap-6">
            <a routerLink="/dashboard" class="flex items-center gap-2">
              <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-black text-white shadow-md shadow-indigo-200">
                P
              </span>
              <span class="text-lg font-bold tracking-tight text-gray-900">
                Prenota<span class="text-indigo-600">24</span>
              </span>
            </a>

            @if (authService.user()) {
              <nav class="hidden md:flex items-center gap-1">
                <a routerLink="/dashboard" routerLinkActive="bg-indigo-50 text-indigo-700" [routerLinkActiveOptions]="{exact: true}"
                  class="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                  Dashboard
                </a>
                <a routerLink="/appuntamenti" routerLinkActive="bg-indigo-50 text-indigo-700"
                  class="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                  Appuntamenti
                </a>
                <a routerLink="/clienti" routerLinkActive="bg-indigo-50 text-indigo-700"
                  class="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                  Clienti
                </a>
                <a routerLink="/professionisti" routerLinkActive="bg-indigo-50 text-indigo-700"
                  class="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                  Team
                </a>
                <a routerLink="/servizi" routerLinkActive="bg-indigo-50 text-indigo-700"
                  class="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                  Servizi
                </a>
                <a routerLink="/eventi" routerLinkActive="bg-indigo-50 text-indigo-700"
                  class="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                  Eventi
                </a>
              </nav>
            }
          </div>

          @if (authService.user()) {
            <div class="flex items-center gap-3">
              <span class="hidden sm:block text-sm text-gray-500">
                {{ authService.user()!.name || authService.user()!.email }}
              </span>
              <button
                (click)="handleLogout()"
                class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                Esci
              </button>

              <!-- Mobile menu toggle -->
              <button (click)="mobileMenuOpen.set(!mobileMenuOpen())"
                class="md:hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  @if (!mobileMenuOpen()) {
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                  } @else {
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  }
                </svg>
              </button>
            </div>
          }
        </div>

        <!-- Mobile nav -->
        @if (mobileMenuOpen()) {
          <nav class="md:hidden border-t border-gray-100 bg-white px-4 pb-3 pt-2 space-y-1">
            <a routerLink="/dashboard" (click)="mobileMenuOpen.set(false)"
              class="block rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">Dashboard</a>
            <a routerLink="/appuntamenti" (click)="mobileMenuOpen.set(false)"
              class="block rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">Appuntamenti</a>
            <a routerLink="/clienti" (click)="mobileMenuOpen.set(false)"
              class="block rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">Clienti</a>
            <a routerLink="/professionisti" (click)="mobileMenuOpen.set(false)"
              class="block rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">Team</a>
            <a routerLink="/servizi" (click)="mobileMenuOpen.set(false)"
              class="block rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">Servizi</a>
            <a routerLink="/eventi" (click)="mobileMenuOpen.set(false)"
              class="block rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">Eventi</a>
          </nav>
        }
      </header>

      <!-- Main Content -->
      <main class="mx-auto max-w-6xl px-6 py-10">
        <ng-content />
      </main>
    </div>
  `,
})
export class PageShellComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly mobileMenuOpen = signal(false);

  handleLogout(): void {
    this.authService.logout();
    this.router.navigate(['/accedi'], { replaceUrl: true });
  }
}
