import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'prenota24-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDark = signal(false);

  constructor() {
    const stored = localStorage.getItem(STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = stored ? stored === 'dark' : prefersDark;
    this.applyTheme(dark);
  }

  toggle(): void {
    this.applyTheme(!this.isDark());
  }

  setLight(): void {
    this.applyTheme(false);
  }

  private applyTheme(dark: boolean): void {
    this.isDark.set(dark);
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
  }
}
