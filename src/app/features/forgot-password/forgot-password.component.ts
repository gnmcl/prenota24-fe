import { Component, OnDestroy, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { getErrorMessage } from '../../shared/utils/errors';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PageShellComponent,
    CardComponent,
    ButtonComponent,
    InputComponent,
    AlertComponent,
  ],
  template: `
    <app-page-shell>
      <div class="mx-auto max-w-sm pt-12">
        <div class="mb-8 text-center">
          <h2 class="text-2xl font-bold text-gray-900">Recupera password</h2>
          <p class="mt-2 text-sm text-gray-500">
            Se la mail è presente nel sistema, riceverai un codice di verifica, inseriscilo qui sotto.
          </p>
        </div>

        <app-card>
          @if (serverError()) {
            <div class="mb-4">
              <app-alert variant="error" [message]="serverError()!" (dismiss)="serverError.set(null)" />
            </div>
          }
          @if (infoMessage()) {
            <div class="mb-4">
              <app-alert variant="info" [message]="infoMessage()!" (dismiss)="infoMessage.set(null)" />
            </div>
          }

          <form [formGroup]="requestForm" (ngSubmit)="onRequestCode()" class="flex flex-col gap-5">
            <app-input
              label="Email"
              type="email"
              placeholder="mario@esempio.com"
              autocomplete="email"
              formControlName="email"
              [error]="requestFieldError('email')"
            />

            <app-button type="submit" [isLoading]="isRequesting()" [disabled]="requestCooldown() > 0">
              @if (requestCooldown() > 0) {
                Riprova tra {{ requestCooldown() }}s
              } @else {
                Invia codice
              }
            </app-button>
          </form>

          <p class="mt-6 text-center text-sm text-gray-500">
            <a routerLink="/accedi" class="font-semibold text-indigo-600 hover:text-indigo-500">Torna al login</a>
          </p>
        </app-card>
      </div>
    </app-page-shell>
  `,
})
export class ForgotPasswordComponent implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly isRequesting = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly infoMessage = signal<string | null>(null);
  readonly cooldownTick = signal(0);
  private readonly cooldownInterval: ReturnType<typeof setInterval>;

  readonly requestForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  constructor() {
    this.cooldownInterval = setInterval(() => {
      this.cooldownTick.update(v => v + 1);
    }, 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.cooldownInterval);
  }

  requestFieldError(field: 'email'): string {
    const control = this.requestForm.get(field);
    if (!control?.touched || !control.errors) return '';
    if (control.errors['required']) return "L'email è obbligatoria";
    if (control.errors['email']) return 'Inserisci un indirizzo email valido';
    return '';
  }

  requestCooldown(): number {
    // Tick dependency to refresh countdown in template.
    this.cooldownTick();
    const email = this.requestForm.getRawValue().email ?? '';
    return this.authService.getRecoverPasswordCooldownSeconds(email);
  }

  async onRequestCode(): Promise<void> {
    this.requestForm.markAllAsTouched();
    if (this.requestForm.invalid) return;

    const cooldown = this.requestCooldown();
    if (cooldown > 0) {
      this.serverError.set('Attendi ' + cooldown + 's prima di richiedere un nuovo codice.');
      return;
    }

    this.serverError.set(null);
    this.isRequesting.set(true);

    try {
      const { email } = this.requestForm.getRawValue();
      await this.authService.recoverPasswordApi({ email: email! });
      this.infoMessage.set('Se la mail è presente nel sistema, riceverai un codice di verifica, inseriscilo qui sotto.');
      this.router.navigate(['/recupera-password/verifica'], { replaceUrl: true, state: { email: email! } });
    } catch (error) {
      this.serverError.set(getErrorMessage(error));
    } finally {
      this.isRequesting.set(false);
    }
  }
}
