import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { getErrorMessage } from '../../shared/utils/errors';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';

function matchPasswords(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  if (password && confirmPassword && password.value !== confirmPassword.value) {
    confirmPassword.setErrors({ ...confirmPassword.errors, passwordMismatch: true });
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PageShellComponent, CardComponent, ButtonComponent, InputComponent, AlertComponent],
  template: `
    <app-page-shell>
      <div class="mx-auto max-w-sm pt-12">
        <div class="mb-8 text-center">
          <h2 class="text-2xl font-bold text-gray-900">Crea il tuo account</h2>
          <p class="mt-1 text-sm text-gray-500">Inizia ad organizzare i tuoi eventi con Prenota24</p>
        </div>

        <app-card>
          @if (serverError) {
            <div class="mb-4">
              <app-alert variant="error" [message]="serverError" (dismiss)="serverError = null" />
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-5">
            <app-input
              label="Il tuo nome"
              type="text"
              placeholder="Mario Rossi"
              autocomplete="name"
              formControlName="name"
              [error]="getFieldError('name')"
            />
            <app-input
              label="Nome studio"
              type="text"
              placeholder="Studio Rossi"
              autocomplete="organization"
              formControlName="studioName"
              [error]="getFieldError('studioName')"
            />
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
              placeholder="Almeno 8 caratteri"
              autocomplete="new-password"
              formControlName="password"
              [error]="getFieldError('password')"
            />
            <app-input
              label="Conferma password"
              type="password"
              placeholder="Ripeti la password"
              autocomplete="new-password"
              formControlName="confirmPassword"
              [error]="getFieldError('confirmPassword')"
            />
            <app-button type="submit" [isLoading]="isLoading">Registrati</app-button>
          </form>

          <p class="mt-6 text-center text-sm text-gray-500">
            Hai già un account?
            <a routerLink="/accedi" class="font-semibold text-indigo-600 hover:text-indigo-500">Accedi</a>
          </p>
        </app-card>
      </div>
    </app-page-shell>
  `,
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    studioName: ['', [Validators.required, Validators.maxLength(255)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
    confirmPassword: ['', [Validators.required]],
  }, { validators: matchPasswords });

  serverError: string | null = null;
  isLoading = false;

  getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control?.touched || !control.errors) return '';
    if (control.errors['required']) {
      const labels: Record<string, string> = { name: 'Il nome è obbligatorio', studioName: 'Il nome dello studio è obbligatorio', email: "L'email è obbligatoria", password: 'La password è obbligatoria', confirmPassword: 'Conferma la password' };
      return labels[field] || 'Campo obbligatorio';
    }
    if (control.errors['email']) return 'Inserisci un indirizzo email valido';
    if (control.errors['minlength']) return 'La password deve avere almeno 8 caratteri';
    if (control.errors['maxlength']) return field === 'name' ? 'Il nome deve avere al massimo 200 caratteri' : 'La password deve avere al massimo 128 caratteri';
    if (control.errors['passwordMismatch']) return 'Le password non coincidono';
    return '';
  }

  async onSubmit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.serverError = null;
    this.isLoading = true;

    try {
      const { name, studioName, email, password } = this.form.getRawValue();
      const response = await this.authService.registerApi({ name: name!, studioName: studioName!, email: email!, password: password! });
      this.authService.setAuth(response.accessToken, response.user);
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    } catch (error) {
      this.serverError = getErrorMessage(error);
    } finally {
      this.isLoading = false;
    }
  }
}
