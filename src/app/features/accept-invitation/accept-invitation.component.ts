import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { InvitationService } from '../../core/services/invitation.service';
import { getErrorMessage } from '../../shared/utils/errors';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import type { InvitationInfo } from '../../core/models/auth.model';

@Component({
  selector: 'app-accept-invitation',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CardComponent, ButtonComponent, InputComponent, AlertComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex items-center justify-center p-6">
      <div class="w-full max-w-md">
        <!-- Logo -->
        <div class="mb-8 text-center">
          <div class="inline-flex items-center gap-2 mb-4">
            <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-black text-white shadow-lg shadow-indigo-200">
              P
            </span>
            <span class="text-xl font-bold tracking-tight text-gray-900">
              Prenota<span class="text-indigo-600">24</span>
            </span>
          </div>
        </div>

        @if (loading()) {
          <app-card>
            <div class="flex flex-col items-center py-8">
              <div class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
              <p class="text-sm text-gray-500">Verifica invito in corso...</p>
            </div>
          </app-card>
        } @else if (error()) {
          <app-card>
            <div class="text-center py-8">
              <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 mb-4">
                <svg class="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Invito non valido</h3>
              <p class="text-sm text-gray-500 mb-6">{{ error() }}</p>
              <a routerLink="/accedi">
                <app-button variant="secondary">Vai al login</app-button>
              </a>
            </div>
          </app-card>
        } @else if (invitationInfo()) {
          @if (invitationInfo()!.status !== 'PENDING') {
            <app-card>
              <div class="text-center py-8">
                <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 mb-4">
                  <svg class="h-6 w-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.997L13.732 4.993c-.77-1.333-2.694-1.333-3.464 0L3.34 16.003c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">
                  @switch (invitationInfo()!.status) {
                    @case ('ACCEPTED') { Invito già utilizzato }
                    @case ('EXPIRED') { Invito scaduto }
                    @case ('REVOKED') { Invito revocato }
                    @default { Invito non disponibile }
                  }
                </h3>
                <p class="text-sm text-gray-500 mb-6">Contatta l'amministratore dello studio per un nuovo invito.</p>
                <a routerLink="/accedi">
                  <app-button variant="secondary">Vai al login</app-button>
                </a>
              </div>
            </app-card>
          } @else {
            <app-card>
              <!-- Welcome header -->
              <div class="mb-6 text-center">
                <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-50 mb-3">
                  <svg class="h-7 w-7 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                </div>
                <h2 class="text-xl font-bold text-gray-900">Benvenuto nel team!</h2>
                <p class="mt-1 text-sm text-gray-500">
                  Sei stato invitato a unirti a <strong class="text-gray-700">{{ invitationInfo()!.studioName }}</strong>
                </p>
              </div>

              <!-- Info box -->
              <div class="rounded-lg bg-indigo-50 p-4 mb-6">
                <div class="flex items-center gap-3 text-sm">
                  <div class="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 shrink-0">
                    <svg class="h-4 w-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <div>
                    <span class="text-indigo-800 font-medium">{{ invitationInfo()!.professionalName }}</span>
                    <span class="text-indigo-600"> · {{ invitationInfo()!.email }}</span>
                  </div>
                </div>
              </div>

              @if (serverError) {
                <div class="mb-4">
                  <app-alert variant="error" [message]="serverError" (dismiss)="serverError = null" />
                </div>
              }

              <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-5">
                <app-input
                  label="Nome completo"
                  type="text"
                  placeholder="Mario Rossi"
                  formControlName="name"
                  [error]="getFieldError('name')"
                />

                <app-input
                  label="Password"
                  type="password"
                  placeholder="Minimo 8 caratteri"
                  autocomplete="new-password"
                  formControlName="password"
                  [error]="getFieldError('password')"
                />

                <app-input
                  label="Conferma Password"
                  type="password"
                  placeholder="Ripeti la password"
                  autocomplete="new-password"
                  formControlName="confirmPassword"
                  [error]="getFieldError('confirmPassword')"
                />

                <app-button type="submit" [isLoading]="isSubmitting">
                  Crea il tuo account
                </app-button>
              </form>

              <p class="mt-6 text-center text-sm text-gray-500">
                Hai già un account?
                <a routerLink="/accedi" class="font-semibold text-indigo-600 hover:text-indigo-500">Accedi</a>
              </p>
            </app-card>
          }
        }
      </div>
    </div>
  `,
})
export class AcceptInvitationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly invitationService = inject(InvitationService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly invitationInfo = signal<InvitationInfo | null>(null);

  serverError: string | null = null;
  isSubmitting = false;
  private token = '';

  form = this.fb.group({
    name: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    if (!this.token) {
      this.error.set('Token invito mancante');
      this.loading.set(false);
      return;
    }

    this.invitationService.getByToken(this.token).subscribe({
      next: (info) => {
        this.invitationInfo.set(info);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(getErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control?.touched || !control.errors) return '';
    if (control.errors['required']) {
      const labels: Record<string, string> = {
        name: 'Il nome è obbligatorio',
        password: 'La password è obbligatoria',
        confirmPassword: 'Conferma la password',
      };
      return labels[field] ?? 'Campo obbligatorio';
    }
    if (control.errors['minlength']) return 'Minimo 8 caratteri';
    return '';
  }

  async onSubmit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { name, password, confirmPassword } = this.form.getRawValue();

    if (password !== confirmPassword) {
      this.serverError = 'Le password non coincidono';
      return;
    }

    this.serverError = null;
    this.isSubmitting = true;

    try {
      const response = await this.authService.acceptInvitationApi({
        token: this.token,
        name: name!,
        password: password!,
      });
      this.authService.setAuth(response.accessToken, response.user);
      this.router.navigate(['/pro/dashboard'], { replaceUrl: true });
    } catch (err) {
      this.serverError = getErrorMessage(err);
    } finally {
      this.isSubmitting = false;
    }
  }
}
