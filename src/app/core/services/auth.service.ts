import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type { AuthUser } from '../models/auth.model';
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, AcceptInvitationRequest } from '../models/auth.model';
import { environment } from '../../environments/environment';
import { StudioService } from './studio.service';

const STORAGE_KEY = 'prenota24-auth';

interface PersistedAuth {
  state: {
    accessToken: string | null;
    user: AuthUser | null;
    isAuthenticated: boolean;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _accessToken = signal<string | null>(null);
  private readonly _user = signal<AuthUser | null>(null);

  readonly accessToken = this._accessToken.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => !!this._accessToken());

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
    private readonly studioService: StudioService,
  ) {
    this.hydrate();
  }

  /** Restore auth state from localStorage */
  private hydrate(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: PersistedAuth = JSON.parse(raw);
        if (parsed.state?.accessToken && parsed.state?.user) {
          this._accessToken.set(parsed.state.accessToken);
          this._user.set(parsed.state.user);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  /** Persist auth state to localStorage */
  private persist(): void {
    const state: PersistedAuth = {
      state: {
        accessToken: this._accessToken(),
        user: this._user(),
        isAuthenticated: this.isAuthenticated(),
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  /** Store token + user after successful login/register */
  setAuth(accessToken: string, user: AuthUser): void {
    this._accessToken.set(accessToken);
    this._user.set(user);
    this.persist();
  }

  /** Clear everything on logout or 401 */
  logout(): void {
    this._accessToken.set(null);
    this._user.set(null);
    this.studioService.clear();
    this.persist();
  }

  /** Authenticate a user with email + password */
  loginApi(payload: LoginRequest): Promise<LoginResponse> {
    return firstValueFrom(
      this.http.post<LoginResponse>(`${environment.apiBaseUrl}/auth/login`, payload),
    );
  }

  /** Register a new user */
  registerApi(payload: RegisterRequest): Promise<RegisterResponse> {
    return firstValueFrom(
      this.http.post<RegisterResponse>(`${environment.apiBaseUrl}/auth/register`, payload),
    );
  }

  /** Accept an invitation and register as professional */
  acceptInvitationApi(payload: AcceptInvitationRequest): Promise<LoginResponse> {
    return firstValueFrom(
      this.http.post<LoginResponse>(`${environment.apiBaseUrl}/auth/accept-invitation`, payload),
    );
  }
}
