import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'prenota24-sidebar-collapsed';

@Injectable({ providedIn: 'root' })
export class NavigationLayoutService {
  readonly isSidebarCollapsed = signal(this.loadPreference());

  toggleSidebar(): void {
    const collapsed = !this.isSidebarCollapsed();
    this.isSidebarCollapsed.set(collapsed);
    localStorage.setItem(STORAGE_KEY, String(collapsed));
  }

  private loadPreference(): boolean {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  }
}
