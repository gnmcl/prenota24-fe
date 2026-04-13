import { Component, inject, signal, computed } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  path: string;
  label: string;
}

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
            <a [routerLink]="homeLink()" class="flex items-center gap-2">
              <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-black text-white shadow-md shadow-indigo-200">
                P
              </span>
              <span class="text-lg font-bold tracking-tight text-gray-900">
                Prenota<span class="text-indigo-600">24</span>
              </span>
            </a>

            @if (authService.user()) {
              <nav class="hidden md:flex items-center gap-1">
                @for (item of navItems(); track item.path) {
                  <a [routerLink]="item.path" routerLinkActive="bg-indigo-50 text-indigo-700"
                    class="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                    {{ item.label }}
                  </a>
                }
              </nav>
            }
          </div>

          @if (authService.user()) {
            <div class="flex items-center gap-3">
              @if (isProfessional()) {
                <span class="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                  <span class="h-1.5 w-1.5 rounded-full bg-violet-500"></span>
                  Professionista
                </span>
              }
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
            @for (item of navItems(); track item.path) {
              <a [routerLink]="item.path" (click)="mobileMenuOpen.set(false)"
                class="block rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">
                {{ item.label }}
              </a>
            }
          </nav>
        }
      </header>

      <!-- Main Content -->
      <main class="mx-auto max-w-7xl px-6 py-10">
        <ng-content />
      </main>
    </div>
  `,
})
export class PageShellComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly mobileMenuOpen = signal(false);

  readonly isProfessional = computed(() => this.authService.user()?.role === 'PROFESSIONAL');

  readonly homeLink = computed(() =>
    this.isProfessional() ? '/pro/dashboard' : '/dashboard'
  );

  readonly navItems = computed<NavItem[]>(() => {
    const user = this.authService.user();
    if (!user) return [];

    if (user.role === 'PROFESSIONAL') {
      return [
        { path: '/pro/dashboard', label: 'Dashboard' },
        { path: '/pro/appuntamenti', label: 'Appuntamenti' },
        { path: '/pro/clienti', label: 'Clienti' },
        { path: '/pro/disponibilita', label: 'Disponibilità' },
        { path: '/pro/profilo', label: 'Profilo' },
      ];
    }

    // ADMIN
    return [
      { path: '/dashboard', label: 'Dashboard' },
      { path: '/appuntamenti', label: 'Appuntamenti' },
      { path: '/clienti', label: 'Clienti' },
      { path: '/professionisti', label: 'Team' },
      { path: '/servizi', label: 'Servizi' },
      { path: '/agenda', label: 'Agenda' },
      { path: '/eventi', label: 'Eventi' },
    ];
  });

  handleLogout(): void {
    this.authService.logout();
    this.router.navigate(['/accedi'], { replaceUrl: true });
  }
}
