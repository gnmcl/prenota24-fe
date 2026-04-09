import { Injectable, signal } from '@angular/core';
import type { Studio, AppUser } from '../models/domain.model';

const STORAGE_KEY = 'prenota24-setup';

interface PersistedSetup {
  state: {
    studio: Studio | null;
    adminUser: AppUser | null;
    setupComplete: boolean;
  };
}

@Injectable({ providedIn: 'root' })
export class SetupService {
  private readonly _studio = signal<Studio | null>(null);
  private readonly _adminUser = signal<AppUser | null>(null);
  private readonly _setupComplete = signal<boolean>(false);

  readonly studio = this._studio.asReadonly();
  readonly adminUser = this._adminUser.asReadonly();
  readonly setupComplete = this._setupComplete.asReadonly();

  constructor() {
    this.hydrate();
  }

  private hydrate(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: PersistedSetup = JSON.parse(raw);
        if (parsed.state) {
          this._studio.set(parsed.state.studio);
          this._adminUser.set(parsed.state.adminUser);
          this._setupComplete.set(parsed.state.setupComplete);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private persist(): void {
    const state: PersistedSetup = {
      state: {
        studio: this._studio(),
        adminUser: this._adminUser(),
        setupComplete: this._setupComplete(),
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  setStudio(studio: Studio): void {
    this._studio.set(studio);
    this.persist();
  }

  setAdminUser(user: AppUser): void {
    this._adminUser.set(user);
    this.persist();
  }

  completeSetup(): void {
    this._setupComplete.set(true);
    this.persist();
  }

  reset(): void {
    this._studio.set(null);
    this._adminUser.set(null);
    this._setupComplete.set(false);
    this.persist();
  }
}
