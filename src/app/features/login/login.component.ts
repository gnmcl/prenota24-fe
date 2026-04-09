import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { getErrorMessage } from '../../shared/utils/errors';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PageShellComponent, CardComponent, ButtonComponent, InputComponent, AlertComponent],
  template: `
    @if (authService.isAuthenticated()) {
      <!-- Will be redirected by guard, but just in case -->
    } @else {
      <app-page-shell>
        <div class="mx-auto max-w-sm pt-12">
          <div class="mb-8 text-center">
            <h2 class="text-2xl font-bold text-gray-900">Bentornato</h2>
            <p class="mt-1 text-sm text-gray-500">Accedi al tuo account Prenota24</p>
          </div>

          <app-card>
            @if (serverError) {
              <div class="mb-4">
                <app-alert variant="error" [message]="serverError" (dismiss)="serverError = null" />
              </div>
            }

            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-5">
              <app-input
                label="Email"
                type="email"
                placeholder="mario@esempio.com"
                autocomplete="email"
                formControlName="email"
                [error]="getFieldError('email')"
              />

              <app-input
                label="Password"
                type="password"
                placeholder="••••••••"
                autocomplete="current-password"
                formControlName="password"
                [error]="getFieldError('password')"
              />

              <app-button type="submit" [isLoading]="isLoading">Accedi</app-button>
            </form>

            <p class="mt-6 text-center text-sm text-gray-500">
              Non hai un account?
              <a routerLink="/registrati" class="font-semibold text-indigo-600 hover:text-indigo-500">Registrati</a>
            </p>
          </app-card>
        </div>
      </app-page-shell>
    }
  `,
})
export class LoginComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  serverError: string | null = null;
  isLoading = false;

  getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control?.touched || !control.errors) return '';
    if (control.errors['required']) {
      return field === 'email' ? "L'email è obbligatoria" : 'La password è obbligatoria';
    }
    if (control.errors['email']) return 'Inserisci un indirizzo email valido';
    return '';
  }

  async onSubmit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.serverError = null;
    this.isLoading = true;

    try {
      const { email, password } = this.form.getRawValue();
      const response = await this.authService.loginApi({ email: email!, password: password! });
      this.authService.setAuth(response.accessToken, response.user);
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    } catch (error) {
      this.serverError = getErrorMessage(error);
    } finally {
      this.isLoading = false;
    }
  }
}
