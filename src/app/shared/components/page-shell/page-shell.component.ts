import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PendingAppointmentsService } from '../../../core/services/pending-appointments.service';
import { StudioService } from '../../../core/services/studio.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ButtonComponent } from '../button/button.component';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-page-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, ButtonComponent],
  template: `
    <div class="min-h-screen bg-[var(--surface-page)] pb-20 md:pb-0">
      @if (authService.user()) {
        <aside
          class="fixed inset-y-0 left-0 z-40 hidden w-[72px] flex-col border-r border-[var(--surface-header-border)] bg-[var(--surface-card)] md:flex xl:w-60"
          aria-label="Navigazione principale"
        >
          <a
            [routerLink]="homeLink()"
            class="flex h-16 items-center border-b border-[var(--surface-header-border)] px-4 xl:px-5"
            aria-label="Prenota24, dashboard"
          >
            <span class="grid h-9 w-9 shrink-0 place-items-center bg-[var(--color-register)] text-[11px] font-bold tracking-[-0.04em] text-[#171A1F]">P24</span>
            <span class="ml-3 hidden text-[15px] font-bold tracking-[-0.02em] text-[var(--text-primary)] xl:block">PRENOTA24</span>
          </a>

          <nav class="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-4 xl:px-3">
            @for (item of navItems(); track item.path) {
              <a
                [routerLink]="item.path"
                routerLinkActive="bg-[var(--surface-active-nav)] text-[var(--color-primary)]"
                [routerLinkActiveOptions]="{ exact: item.path === '/dashboard' || item.path === '/pro/dashboard' }"
                class="group relative flex min-h-11 items-center justify-center rounded-[var(--radius-lg)] px-3 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] xl:justify-start xl:gap-3"
                [attr.title]="item.label"
              >
                <svg class="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.65" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="item.icon" />
                </svg>
                <span class="hidden text-[13px] font-medium xl:block">{{ item.label }}</span>
                @if (isAppointmentsPath(item.path) && pendingService.pendingCount() > 0) {
                  <span class="absolute right-2 top-2 h-2 w-2 bg-[var(--color-register)] ring-1 ring-[var(--text-primary)] xl:static xl:ml-auto xl:h-auto xl:min-w-5 xl:px-1 xl:py-0.5 xl:text-center xl:text-[10px] xl:font-bold xl:leading-4 xl:text-[#171A1F] xl:ring-0">
                    <span class="hidden xl:inline">{{ pendingService.pendingCount() }}</span>
                  </span>
                }
              </a>
            }
          </nav>

          <div class="border-t border-[var(--surface-header-border)] p-2 xl:p-3">
            <a
              routerLink="/settings"
              routerLinkActive="bg-[var(--surface-active-nav)] text-[var(--color-primary)]"
              class="flex min-h-11 items-center justify-center rounded-[var(--radius-lg)] px-3 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] xl:justify-start xl:gap-3"
              title="Impostazioni"
            >
              <svg class="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.65" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span class="hidden text-[13px] font-medium xl:block">Impostazioni</span>
            </a>
          </div>
        </aside>
      }

      <div [class]="authService.user() ? 'md:pl-[72px] xl:pl-60' : ''">
        <header class="sticky top-0 z-30 h-14 border-b border-[var(--surface-header-border)] bg-[var(--surface-header)] md:h-16">
          <div class="flex h-full items-center justify-between px-4 sm:px-5 lg:px-7">
            <a [routerLink]="homeLink()" class="flex items-center gap-2.5 md:hidden" aria-label="Prenota24, dashboard">
              <span class="grid h-8 w-8 place-items-center bg-[var(--color-register)] text-[10px] font-bold text-[#171A1F]">P24</span>
              <span class="text-sm font-bold tracking-[-0.02em] text-[var(--text-primary)]">PRENOTA24</span>
            </a>

            @if (authService.user()) {
              <div class="hidden min-w-0 items-center gap-3 md:flex">
                <span class="h-2 w-2 bg-[var(--color-register)]" aria-hidden="true"></span>
                <div class="min-w-0">
                  <p class="truncate text-[13px] font-semibold text-[var(--text-primary)]">
                    {{ studioService.studio()?.name || authService.user()!.email }}
                  </p>
                  <p class="text-[11px] text-[var(--text-tertiary)]">{{ isProfessional() ? 'Area professionista' : 'Coordinamento studio' }}</p>
                </div>
              </div>

              <div class="flex items-center gap-1.5">
                <a routerLink="/appuntamenti/nuovo" class="hidden sm:block">
                  <app-button size="sm">
                    <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" aria-hidden="true">
                      <path stroke-linecap="round" d="M12 5v14M5 12h14" />
                    </svg>
                    Prenotazione
                  </app-button>
                </a>

                <app-button variant="ghost" size="icon" (click)="themeService.toggle()" [attr.aria-label]="themeService.isDark() ? 'Attiva tema chiaro' : 'Attiva tema scuro'">
                  @if (themeService.isDark()) {
                    <svg class="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.6" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                    </svg>
                  } @else {
                    <svg class="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.6" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                    </svg>
                  }
                </app-button>

                <div class="relative hidden sm:block" data-studio-menu>
                  <app-button variant="ghost" size="sm" (click)="studioDropdownOpen.set(!studioDropdownOpen())">
                    {{ userInitials() }}
                    <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m7 10 5 5 5-5" />
                    </svg>
                  </app-button>

                  @if (studioDropdownOpen()) {
                    <div class="absolute right-0 top-full z-50 mt-2 w-72 rounded-[var(--radius-lg)] border border-[var(--surface-card-border)] bg-[var(--surface-card)]">
                      <div class="border-b border-[var(--surface-card-border)] p-4">
                        <p class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Sessione attiva</p>
                        <p class="mt-2 truncate text-sm font-semibold text-[var(--text-primary)]">{{ studioService.studio()?.name || authService.user()!.email }}</p>
                        <p class="mt-0.5 truncate text-xs text-[var(--text-secondary)]">{{ authService.user()!.email }}</p>
                      </div>
                      <div class="grid gap-1 p-2">
                        <a routerLink="/settings" (click)="studioDropdownOpen.set(false)" class="rounded-[var(--radius-lg)] px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]">Impostazioni studio</a>
                        <button type="button" (click)="handleLogout()" class="rounded-[var(--radius-lg)] px-3 py-2.5 text-left text-sm text-[var(--status-danger-text)] hover:bg-[var(--status-danger-bg)]">Esci</button>
                      </div>
                    </div>
                  }
                </div>

                <app-button variant="ghost" size="icon" extraClass="md:hidden" (click)="mobileMenuOpen.set(!mobileMenuOpen())" [attr.aria-expanded]="mobileMenuOpen()" aria-label="Apri navigazione">
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.6" aria-hidden="true">
                    @if (mobileMenuOpen()) {
                      <path stroke-linecap="round" d="M6 6l12 12M18 6 6 18" />
                    } @else {
                      <path stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16" />
                    }
                  </svg>
                </app-button>
              </div>
            }
          </div>
        </header>

        @if (mobileMenuOpen()) {
          <nav class="fixed inset-x-0 top-14 z-40 max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-b border-[var(--surface-header-border)] bg-[var(--surface-card)] p-3 md:hidden" aria-label="Tutte le sezioni">
            <div class="grid grid-cols-2 gap-px overflow-hidden border border-[var(--surface-card-border)] bg-[var(--surface-card-border)]">
              @for (item of navItems(); track item.path) {
                <a [routerLink]="item.path" (click)="mobileMenuOpen.set(false)" routerLinkActive="text-[var(--color-primary)] bg-[var(--surface-active-nav)]" class="flex min-h-12 items-center gap-2.5 bg-[var(--surface-card)] px-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]">
                  <svg class="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.6" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" [attr.d]="item.icon" /></svg>
                  {{ item.label }}
                </a>
              }
            </div>
            <div class="mt-3 flex items-center justify-between border-t border-[var(--surface-card-border)] pt-3">
              <a routerLink="/settings" (click)="mobileMenuOpen.set(false)" class="text-sm font-medium text-[var(--text-secondary)]">Impostazioni</a>
              <app-button variant="ghost" size="sm" (click)="handleLogout()">Esci</app-button>
            </div>
          </nav>
        }

        <main class="px-3 py-4 sm:px-5 sm:py-5 lg:px-7 lg:py-6">
          <ng-content />
        </main>
      </div>

      @if (authService.user()) {
        <nav class="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-[var(--surface-header-border)] bg-[var(--surface-card)] md:hidden" aria-label="Navigazione rapida">
          <div class="grid" [style.grid-template-columns]="'repeat(' + bottomNavItems().length + ', 1fr)'">
            @for (item of bottomNavItems(); track item.path) {
              <a [routerLink]="item.path" routerLinkActive="text-[var(--color-primary)]" [routerLinkActiveOptions]="{ exact: item.path === '/dashboard' || item.path === '/pro/dashboard' }" class="relative flex min-h-15 flex-col items-center justify-center gap-1 text-[var(--text-tertiary)]">
                <svg class="h-[19px] w-[19px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.65" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" [attr.d]="item.icon" /></svg>
                <span class="text-[10px] font-medium">{{ item.label }}</span>
                @if (isAppointmentsPath(item.path) && pendingService.pendingCount() > 0) {
                  <span class="absolute right-[28%] top-2 h-2 w-2 bg-[var(--color-register)] ring-1 ring-[var(--text-primary)]"></span>
                }
              </a>
            }
          </div>
        </nav>
      }
    </div>
  `,
  styles: [`
    .safe-bottom { padding-bottom: env(safe-area-inset-bottom, 0px); }
  `],
})
export class PageShellComponent {
  readonly authService = inject(AuthService);
  readonly studioService = inject(StudioService);
  readonly themeService = inject(ThemeService);
  readonly pendingService = inject(PendingAppointmentsService);
  private readonly router = inject(Router);
  readonly mobileMenuOpen = signal(false);
  readonly studioDropdownOpen = signal(false);

  constructor() {
    const user = this.authService.user();
    if (user?.role === 'ADMIN' && !this.studioService.studio()) {
      this.studioService.getMyStudio(user.studioId).subscribe();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target;
    if (this.studioDropdownOpen() && target instanceof Element && !target.closest('[data-studio-menu]')) {
      this.studioDropdownOpen.set(false);
    }
  }

  readonly isProfessional = computed(() => this.authService.user()?.role === 'PROFESSIONAL');

  readonly homeLink = computed(() => {
    const user = this.authService.user();
    if (!user) return '/';
    return user.role === 'PROFESSIONAL' ? '/pro/dashboard' : '/dashboard';
  });

  readonly userInitials = computed(() => {
    const user = this.authService.user();
    const source = user?.name?.trim() || user?.email || 'P24';
    return source.split(/\s|@/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
  });

  readonly navItems = computed<NavItem[]>(() => {
    if (this.isProfessional()) {
      return [
        { path: '/pro/dashboard', label: 'Dashboard', icon: 'M3 12l9-9 9 9M5.25 9.75V21h13.5V9.75' },
        { path: '/pro/appuntamenti', label: 'Appuntamenti', icon: 'M8 3v3m8-3v3M4.5 9h15M5 5.5h14a1 1 0 011 1V20H4V6.5a1 1 0 011-1z' },
        { path: '/pro/clienti', label: 'Clienti', icon: 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2m7-10a4 4 0 100-8 4 4 0 000 8zm13 10v-2a4 4 0 00-3-3.87m-3-11.96a4 4 0 010 7.75' },
        { path: '/pro/disponibilita', label: 'Disponibilità', icon: 'M12 6v6l4 2m5-2a9 9 0 11-18 0 9 9 0 0118 0z' },
        { path: '/pro/profilo', label: 'Profilo', icon: 'M20 21a8 8 0 00-16 0m8-10a4 4 0 100-8 4 4 0 000 8z' },
      ];
    }

    return [
      { path: '/dashboard', label: 'Dashboard', icon: 'M3 12l9-9 9 9M5.25 9.75V21h13.5V9.75' },
      { path: '/appuntamenti', label: 'Appuntamenti', icon: 'M8 3v3m8-3v3M4.5 9h15M5 5.5h14a1 1 0 011 1V20H4V6.5a1 1 0 011-1z' },
      { path: '/clienti', label: 'Clienti', icon: 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2m7-10a4 4 0 100-8 4 4 0 000 8zm13 10v-2a4 4 0 00-3-3.87m-3-11.96a4 4 0 010 7.75' },
      { path: '/professionisti', label: 'Team', icon: 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2m3-8a4 4 0 100-8 4 4 0 000 8zm13 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
      { path: '/servizi', label: 'Servizi', icon: 'M4 7h16M7 4v16m10-16v16M4 17h16' },
      { path: '/agenda', label: 'Agenda', icon: 'M9 5H6a2 2 0 00-2 2v12h16V7a2 2 0 00-2-2h-3M9 5a3 3 0 006 0M9 12h6m-6 4h6' },
      { path: '/eventi', label: 'Eventi', icon: 'M12 3l2.6 5.3 5.9.9-4.25 4.15 1 5.85L12 16.45 6.75 19.2l1-5.85L3.5 9.2l5.9-.9L12 3z' },
    ];
  });

  readonly bottomNavItems = computed<NavItem[]>(() => {
    const items = this.navItems();
    if (this.isProfessional()) return items.slice(0, 5);
    return [items[0], items[1], items[5], items[2], items[3]].filter((item): item is NavItem => item !== undefined);
  });

  isAppointmentsPath(path: string): boolean {
    return path === '/appuntamenti' || path === '/pro/appuntamenti';
  }

  handleLogout(): void {
    this.authService.logout();
    void this.router.navigate(['/accedi'], { replaceUrl: true });
  }
}
