import { Component, inject, signal, computed, HostListener } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { StudioService } from '../../../core/services/studio.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-page-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <!-- Header -->
      <header class="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
        <div class="mx-auto flex h-14 sm:h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div class="flex items-center gap-4 sm:gap-6">
            <a [routerLink]="homeLink()" class="flex items-center gap-2">
              <span class="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-[10px] sm:text-xs font-black text-white shadow-md shadow-indigo-200">
                P
              </span>
              <span class="text-base sm:text-lg font-bold tracking-tight text-gray-900">
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
            <div class="flex items-center gap-2 sm:gap-3">
              @if (isProfessional()) {
                <span class="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                  <span class="h-1.5 w-1.5 rounded-full bg-violet-500"></span>
                  Professionista
                </span>
              }

              <!-- Studio name (clickable for dropdown) -->
              @if (!isProfessional()) {
                <div class="relative">
                  <button (click)="studioDropdownOpen.set(!studioDropdownOpen())"
                    class="hidden sm:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                    <span class="max-w-[160px] truncate">{{ studioService.studio()?.name || authService.user()!.email }}</span>
                    <svg class="h-3.5 w-3.5 text-gray-400 transition-transform" [class.rotate-180]="studioDropdownOpen()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>

                  <!-- Studio info dropdown -->
                  @if (studioDropdownOpen()) {
                    <div class="absolute right-0 top-full mt-2 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-lg z-50 animate-fade-in">
                      <h4 class="text-sm font-semibold text-gray-900 mb-3">Informazioni studio</h4>
                      @if (studioService.studio()) {
                        <dl class="space-y-2.5">
                          <div>
                            <dt class="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Nome</dt>
                            <dd class="text-sm text-gray-900">{{ studioService.studio()!.name }}</dd>
                          </div>
                          @if (studioService.studio()!.email) {
                            <div>
                              <dt class="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Email</dt>
                              <dd class="text-sm text-gray-700">{{ studioService.studio()!.email }}</dd>
                            </div>
                          }
                          @if (studioService.studio()!.phone) {
                            <div>
                              <dt class="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Telefono</dt>
                              <dd class="text-sm text-gray-700">{{ studioService.studio()!.phone }}</dd>
                            </div>
                          }
                          <div>
                            <dt class="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Fuso orario</dt>
                            <dd class="text-sm text-gray-700">{{ studioService.studio()!.timezone }}</dd>
                          </div>
                        </dl>
                        <div class="mt-4 pt-3 border-t border-gray-100">
                          <a routerLink="/settings" (click)="studioDropdownOpen.set(false)"
                            class="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            </svg>
                            Impostazioni
                          </a>
                        </div>
                      } @else {
                        <p class="text-sm text-gray-400">Caricamento...</p>
                      }
                    </div>
                  }
                </div>

                <a routerLink="/settings" routerLinkActive="text-indigo-600"
                  class="hidden md:block rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                  title="Impostazioni">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </a>
              }

              <button
                (click)="handleLogout()"
                class="hidden sm:block rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
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

        <!-- Mobile nav overlay -->
        @if (mobileMenuOpen()) {
          <div class="md:hidden fixed inset-0 top-14 z-40 bg-black/30 backdrop-blur-sm" (click)="mobileMenuOpen.set(false)"></div>
          <nav class="md:hidden fixed top-14 left-0 right-0 z-50 border-t border-gray-100 bg-white px-4 pb-4 pt-2 space-y-1 shadow-lg max-h-[80vh] overflow-y-auto">
            @for (item of navItems(); track item.path) {
              <a [routerLink]="item.path" (click)="mobileMenuOpen.set(false)"
                routerLinkActive="bg-indigo-50 text-indigo-700"
                class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100">
                <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="item.icon" />
                </svg>
                {{ item.label }}
              </a>
            }
            @if (!isProfessional()) {
              <a routerLink="/settings" (click)="mobileMenuOpen.set(false)"
                class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100">
                <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                Impostazioni
              </a>
            }
            <div class="pt-2 border-t border-gray-100">
              <button (click)="handleLogout()" class="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">
                <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"/>
                </svg>
                Esci
              </button>
            </div>
          </nav>
        }
      </header>

      <!-- Main Content -->
      <main class="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10">
        <ng-content />
      </main>

      <!-- Mobile bottom navigation -->
      @if (authService.user()) {
        <nav class="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur-sm safe-bottom">
          <div class="grid" [style.grid-template-columns]="'repeat(' + bottomNavItems().length + ', 1fr)'">
            @for (item of bottomNavItems(); track item.path) {
              <a [routerLink]="item.path" routerLinkActive="text-indigo-600"
                [routerLinkActiveOptions]="{exact: item.path === '/dashboard' || item.path === '/pro/dashboard'}"
                class="flex flex-col items-center gap-0.5 py-2 text-gray-400 transition-colors">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="item.icon" />
                </svg>
                <span class="text-[10px] font-medium">{{ item.label }}</span>
              </a>
            }
          </div>
        </nav>
      }
    </div>
  `,
  styles: [`
    .safe-bottom {
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }
    .animate-fade-in {
      animation: fadeIn 0.15s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
})
export class PageShellComponent {
  readonly authService = inject(AuthService);
  readonly studioService = inject(StudioService);
  private readonly router = inject(Router);
  readonly mobileMenuOpen = signal(false);
  readonly studioDropdownOpen = signal(false);

  constructor() {
    const user = this.authService.user();
    if (user && user.role === 'ADMIN' && !this.studioService.studio()) {
      this.studioService.getMyStudio(user.studioId).subscribe();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Close studio dropdown on outside click
    const target = event.target as HTMLElement;
    if (this.studioDropdownOpen() && !target.closest('[class*="relative"]')) {
      this.studioDropdownOpen.set(false);
    }
  }

  readonly isProfessional = computed(() => this.authService.user()?.role === 'PROFESSIONAL');

  readonly homeLink = computed(() => {
    const user = this.authService.user();
    if (!user) return '/';
    return user.role === 'PROFESSIONAL' ? '/pro/dashboard' : '/dashboard';
  });

  readonly navItems = computed<NavItem[]>(() => {
    const user = this.authService.user();
    if (!user) return [];

    if (user.role === 'PROFESSIONAL') {
      return [
        { path: '/pro/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { path: '/pro/appuntamenti', label: 'Appuntamenti', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
        { path: '/pro/clienti', label: 'Clienti', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
        { path: '/pro/disponibilita', label: 'Disponibilità', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
        { path: '/pro/profilo', label: 'Profilo', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
      ];
    }

    // ADMIN
    return [
      { path: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
      { path: '/appuntamenti', label: 'Appuntamenti', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
      { path: '/clienti', label: 'Clienti', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
      { path: '/professionisti', label: 'Team', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
      { path: '/servizi', label: 'Servizi', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
      { path: '/agenda', label: 'Agenda', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
      { path: '/eventi', label: 'Eventi', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
    ];
  });

  /** Bottom nav shows only the 5 most important items */
  readonly bottomNavItems = computed<NavItem[]>(() => {
    const items = this.navItems();
    if (this.isProfessional()) return items.slice(0, 5);
    // Admin: Dashboard, Appuntamenti, Agenda, Clienti, Team
    return [items[0], items[1], items[5], items[2], items[3]].filter(Boolean);
  });

  handleLogout(): void {
    this.authService.logout();
    this.router.navigate(['/accedi'], { replaceUrl: true });
  }
}
