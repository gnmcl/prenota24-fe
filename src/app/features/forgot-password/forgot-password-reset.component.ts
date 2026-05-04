import { Component, OnDestroy, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { getErrorMessage } from '../../shared/utils/errors';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { VerificationCodeInputComponent } from '../../shared/components/verification-code-input/verification-code-input.component';

function matchPasswords(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword');
  const confirmPassword = control.get('confirmPassword');

  if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
    confirmPassword.setErrors({ ...confirmPassword.errors, passwordMismatch: true });
    return { passwordMismatch: true };
  }

  return null;
}

@Component({
  selector: 'app-forgot-password-reset',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PageShellComponent,
    CardComponent,
    ButtonComponent,
    InputComponent,
    AlertComponent,
    VerificationCodeInputComponent,
  ],
  template: `
    <app-page-shell>
      <div class="mx-auto max-w-sm pt-12">
        <div class="mb-8 text-center">
          <h2 class="text-2xl font-bold text-gray-900">Recupera password</h2>
          <p class="mt-2 text-sm text-gray-500">
            Se la mail è presente nel sistema, riceverai un codice di verifica, inseriscilo qui sotto.
          </p>
          <p class="mt-1 text-sm text-gray-500">
            Email: <span class="font-medium text-gray-700">{{ email }}</span>
          </p>
        </div>

        <app-card>
          @if (serverError()) {
            <div class="mb-4">
              <app-alert variant="error" [message]="serverError()!" (dismiss)="serverError.set(null)" />
            </div>
          }
          @if (successMessage()) {
            <div class="mb-4">
              <app-alert variant="success" [message]="successMessage()!" (dismiss)="successMessage.set(null)" />
            </div>
          }
          @if (infoMessage()) {
            <div class="mb-4">
              <app-alert variant="info" [message]="infoMessage()!" (dismiss)="infoMessage.set(null)" />
            </div>
          }

          @if (!codeVerified()) {
            <form [formGroup]="verifyForm" (ngSubmit)="onVerifyCode()" class="flex flex-col gap-5">
              <app-verification-code-input
                formControlName="code"
                [error]="verifyCodeError()"
              />

              <app-button type="submit" [isLoading]="isVerifyingCode()">Verifica</app-button>
            </form>
          } @else {
            <form [formGroup]="resetForm" (ngSubmit)="onResetPassword()" class="flex flex-col gap-5">
              <app-input
                label="Nuova password"
                type="password"
                placeholder="Almeno 8 caratteri"
                autocomplete="new-password"
                formControlName="newPassword"
                [error]="resetFieldError('newPassword')"
              />

              <app-input
                label="Conferma nuova password"
                type="password"
                placeholder="Ripeti la password"
                autocomplete="new-password"
                formControlName="confirmPassword"
                [error]="resetFieldError('confirmPassword')"
              />

              <app-button type="submit" [isLoading]="isResetting()">Reimposta password</app-button>
            </form>
          }

          <div class="mt-6 text-center text-sm text-gray-500">
            <button
              type="button"
              (click)="onResendCode()"
              [disabled]="isResending() || resendCooldown() > 0"
              class="font-semibold text-indigo-600 hover:text-indigo-500 disabled:cursor-not-allowed disabled:text-gray-400"
            >
              @if (isResending()) {
                Invio in corso...
              } @else if (resendCooldown() > 0) {
                Reinvia tra {{ resendCooldown() }}s
              } @else {
                Reinvia codice
              }
            </button>
          </div>

          <p class="mt-4 text-center text-sm text-gray-500">
            <a routerLink="/accedi" class="font-semibold text-indigo-600 hover:text-indigo-500">Torna al login</a>
          </p>
        </app-card>
      </div>
    </app-page-shell>
  `,
})
export class ForgotPasswordResetComponent implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly email: string = history.state?.email || '';

  readonly isVerifyingCode = signal(false);
  readonly isResetting = signal(false);
  readonly isResending = signal(false);
  readonly cooldownTick = signal(0);
  readonly codeVerified = signal(false);
  readonly verifiedCode = signal<string>('');
  readonly serverError = signal<string | null>(null);
  readonly infoMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  private cooldownInterval: ReturnType<typeof setInterval> | null = null;

  readonly verifyForm = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern(/^\d{6}$/)]],
  });

  readonly resetForm = this.fb.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: matchPasswords }
  );

  constructor() {
    if (!this.email) {
      this.router.navigate(['/recupera-password'], { replaceUrl: true });
      return;
    }

    this.cooldownInterval = setInterval(() => {
      this.cooldownTick.update(v => v + 1);
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
      this.cooldownInterval = null;
    }
  }

  resendCooldown(): number {
    this.cooldownTick();
    return this.authService.getRecoverPasswordCooldownSeconds(this.email);
  }

  verifyCodeError(): string {
    const control = this.verifyForm.get('code');
    if (!control?.touched || !control.errors) return '';
    return 'Inserisci il codice di 6 cifre';
  }

  resetFieldError(field: 'newPassword' | 'confirmPassword'): string {
    const control = this.resetForm.get(field);
    if (!control?.touched || !control.errors) return '';

    if (control.errors['required']) return field === 'newPassword' ? 'La nuova password è obbligatoria' : 'Conferma la password';
    if (control.errors['minlength']) return 'La password deve avere almeno 8 caratteri';
    if (control.errors['maxlength']) return 'La password deve avere al massimo 128 caratteri';
    if (control.errors['passwordMismatch']) return 'Le password non coincidono';
    return '';
  }

  async onVerifyCode(): Promise<void> {
    this.verifyForm.markAllAsTouched();
    if (this.verifyForm.invalid) return;

    this.serverError.set(null);
    this.infoMessage.set(null);
    this.isVerifyingCode.set(true);

    try {
      const code = this.verifyForm.getRawValue().code!;
      this.verifiedCode.set(code);
      this.codeVerified.set(true);
      this.successMessage.set('Codice verificato. Ora imposta la nuova password.');
    } finally {
      this.isVerifyingCode.set(false);
    }
  }

  async onResetPassword(): Promise<void> {
    this.resetForm.markAllAsTouched();
    if (this.resetForm.invalid || !this.codeVerified()) return;

    this.serverError.set(null);
    this.successMessage.set(null);
    this.infoMessage.set(null);
    this.isResetting.set(true);

    try {
      const { newPassword } = this.resetForm.getRawValue();
      await this.authService.resetPasswordApi({
        email: this.email,
        code: this.verifiedCode(),
        newPassword: newPassword!,
      });

      this.successMessage.set('Password aggiornata con successo. Ora puoi accedere con la nuova password.');
      this.resetForm.reset();
      this.codeVerified.set(false);
      this.verifiedCode.set('');
      this.verifyForm.reset();
    } catch (error) {
      this.serverError.set(getErrorMessage(error));
      this.codeVerified.set(false);
    } finally {
      this.isResetting.set(false);
    }
  }

  async onResendCode(): Promise<void> {
    if (this.resendCooldown() > 0) return;

    this.serverError.set(null);
    this.successMessage.set(null);
    this.isResending.set(true);

    try {
      await this.authService.recoverPasswordApi({ email: this.email });
      this.infoMessage.set('Se la mail è presente nel sistema, riceverai un nuovo codice di verifica.');
      this.codeVerified.set(false);
      this.verifiedCode.set('');
      this.verifyForm.reset();
    } catch (error) {
      this.serverError.set(getErrorMessage(error));
    } finally {
      this.isResending.set(false);
    }
  }
}
