import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type { AuthUser } from '../models/auth.model';
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, AcceptInvitationRequest, VerifyEmailRequest, ResendVerificationRequest } from '../models/auth.model';
import { environment } from '../../environments/environment';
import { StudioService } from './studio.service';

const STORAGE_KEY = 'prenota24-auth';

interface PersistedAuth {
  state: {
    accessToken: string | null;
    refreshToken: string | null;
    user: AuthUser | null;
    isAuthenticated: boolean;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _accessToken = signal<string | null>(null);
  private readonly _refreshToken = signal<string | null>(null);
  private readonly _user = signal<AuthUser | null>(null);
  private _refreshPromise: Promise<LoginResponse> | null = null;

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
          this._refreshToken.set(parsed.state.refreshToken ?? null);
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
        refreshToken: this._refreshToken(),
        user: this._user(),
        isAuthenticated: this.isAuthenticated(),
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  /** Store tokens + user after successful login/register/verify */
  setAuth(accessToken: string, user: AuthUser, refreshToken?: string): void {
    this._accessToken.set(accessToken);
    if (refreshToken) this._refreshToken.set(refreshToken);
    this._user.set(user);
    this.persist();
  }

  /** Clear everything on logout or 401 */
  logout(): void {
    const rt = this._refreshToken();
    this._accessToken.set(null);
    this._refreshToken.set(null);
    this._user.set(null);
    this.studioService.clear();
    this.persist();
    // Best-effort server-side logout
    if (rt) {
      firstValueFrom(
        this.http.post<void>(`${environment.apiBaseUrl}/auth/logout`, {}),
      ).catch(() => {});
    }
  }

  /** Attempt to refresh the access token using the stored refresh token */
  async refreshAccessToken(): Promise<LoginResponse> {
    const rt = this._refreshToken();
    if (!rt) throw new Error('No refresh token');

    // Deduplicate concurrent refresh calls
    if (!this._refreshPromise) {
      this._refreshPromise = firstValueFrom(
        this.http.post<LoginResponse>(`${environment.apiBaseUrl}/auth/refresh`, { refreshToken: rt }),
      ).then(response => {
        this.setAuth(response.accessToken, response.user, response.refreshToken);
        return response;
      }).catch(err => {
        this.logout();
        this.router.navigate(['/accedi'], { replaceUrl: true });
        throw err;
      }).finally(() => {
        this._refreshPromise = null;
      });
    }

    return this._refreshPromise;
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

  /** Verify email with 6-digit code */
  verifyEmailApi(payload: VerifyEmailRequest): Promise<LoginResponse> {
    return firstValueFrom(
      this.http.post<LoginResponse>(`${environment.apiBaseUrl}/auth/verify-email`, payload),
    );
  }

  /** Resend verification code */
  resendVerificationApi(payload: ResendVerificationRequest): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`${environment.apiBaseUrl}/auth/resend-verification`, payload),
    );
  }

  /** Accept an invitation and register as professional */
  acceptInvitationApi(payload: AcceptInvitationRequest): Promise<LoginResponse> {
    return firstValueFrom(
      this.http.post<LoginResponse>(`${environment.apiBaseUrl}/auth/accept-invitation`, payload),
    );
  }
}
