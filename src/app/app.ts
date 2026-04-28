import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);

  private readonly publicPaths = ['/', '/accedi', '/registrati', '/verifica-email', '/invito/', '/e/'];

  constructor() {
    this.enforcePublicTheme(this.router.url);

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.enforcePublicTheme(event.urlAfterRedirects));
  }

  private enforcePublicTheme(url: string): void {
    const normalizedPath = (url.split('?')[0] ?? '/').split('#')[0] ?? '/';
    const isPublicRoute = this.publicPaths.some((path) =>
      path === '/'
        ? normalizedPath === '/'
        : normalizedPath === path || normalizedPath.startsWith(path),
    );

    if (isPublicRoute) {
      this.themeService.setLight();
    }
  }
}
