import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { getErrorMessage } from '../../shared/utils/errors';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PageShellComponent, CardComponent, ButtonComponent, AlertComponent],
  template: `
    <app-page-shell>
      <div class="mx-auto max-w-sm pt-12">
        <div class="mb-8 text-center">
          <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
            <svg class="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900">Verifica la tua email</h2>
          <p class="mt-2 text-sm text-gray-500">
            Abbiamo inviato un codice di 6 cifre a
            <span class="font-medium text-gray-700">{{ email }}</span>
          </p>
        </div>

        <app-card>
          @if (serverError) {
            <div class="mb-4">
              <app-alert variant="error" [message]="serverError" (dismiss)="serverError = null" />
            </div>
          }
          @if (successMessage) {
            <div class="mb-4">
              <app-alert variant="success" [message]="successMessage" />
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-5">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700">Codice di verifica</label>
              <input
                type="text"
                formControlName="code"
                maxlength="6"
                inputmode="numeric"
                placeholder="000000"
                class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-2xl font-semibold tracking-[0.5em] placeholder:tracking-[0.5em] placeholder:text-gray-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              @if (form.get('code')?.touched && form.get('code')?.errors) {
                <p class="mt-1 text-sm text-red-600">Inserisci il codice di 6 cifre</p>
              }
            </div>

            <app-button type="submit" [isLoading]="isLoading">Verifica</app-button>
          </form>

          <div class="mt-6 text-center">
            <p class="text-sm text-gray-500">
              Non hai ricevuto il codice?
              <button
                type="button"
                (click)="onResend()"
                [disabled]="isResending || resendCooldown > 0"
                class="font-semibold text-indigo-600 hover:text-indigo-500 disabled:cursor-not-allowed disabled:text-gray-400"
              >
                @if (resendCooldown > 0) {
                  Reinvia tra {{ resendCooldown }}s
                } @else {
                  Reinvia codice
                }
              </button>
            </p>
            <p class="mt-3 text-sm text-gray-500">
              <a routerLink="/registrati" class="font-semibold text-indigo-600 hover:text-indigo-500">Torna alla registrazione</a>
            </p>
          </div>
        </app-card>
      </div>
    </app-page-shell>
  `,
})
export class VerifyEmailComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  email = '';
  serverError: string | null = null;
  successMessage: string | null = null;
  isLoading = false;
  isResending = false;
  resendCooldown = 0;
  private cooldownInterval: ReturnType<typeof setInterval> | null = null;

  form = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern(/^\d{6}$/)]],
  });

  ngOnInit(): void {
    this.email = history.state?.email || '';
    if (!this.email) {
      this.router.navigate(['/registrati'], { replaceUrl: true });
    }
  }

  async onSubmit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.serverError = null;
    this.successMessage = null;
    this.isLoading = true;

    try {
      const response = await this.authService.verifyEmailApi({
        email: this.email,
        code: this.form.getRawValue().code!,
      });
      this.authService.setAuth(response.accessToken, response.user);
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    } catch (error) {
      this.serverError = getErrorMessage(error);
    } finally {
      this.isLoading = false;
    }
  }

  async onResend(): Promise<void> {
    this.serverError = null;
    this.successMessage = null;
    this.isResending = true;

    try {
      await this.authService.resendVerificationApi({ email: this.email });
      this.successMessage = 'Nuovo codice inviato! Controlla la tua casella di posta.';
      this.startCooldown();
    } catch (error) {
      this.serverError = getErrorMessage(error);
    } finally {
      this.isResending = false;
    }
  }

  private startCooldown(): void {
    this.resendCooldown = 60;
    if (this.cooldownInterval) clearInterval(this.cooldownInterval);
    this.cooldownInterval = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0 && this.cooldownInterval) {
        clearInterval(this.cooldownInterval);
        this.cooldownInterval = null;
      }
    }, 1000);
  }
}
