import { Component, ElementRef, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { getErrorMessage, isApiError } from '../../shared/utils/errors';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { PublicHeaderComponent } from '../../shared/components/public-header/public-header.component';

/**
 * Sign in (/accedi), on the public pages' system (src/styles/landing.css): one screen, the form on the
 * left, from 640px the day the user finds after signing in drawn on the right.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, InputComponent, AlertComponent, PublicHeaderComponent],
  template: `
    <div class="landing">
      <app-public-header prompt="Non hai ancora uno studio?" actionLabel="Crea il tuo studio" actionRoute="/registrati" />

      <main id="top">
        <section class="auth" data-enter aria-labelledby="login-title">
          <div class="wrap auth__grid">
            <div class="auth__form">
              <h1 id="login-title">Accedi a Prenota24</h1>
              <p class="auth__lead">Entra nell’agenda del tuo studio o nel tuo portale da professionista.</p>

              @if (serverError()) {
                <div class="auth__alert">
                  <app-alert variant="error" [message]="serverError()!" (dismiss)="serverError.set(null)" />
                </div>
              }

              <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth__fields" novalidate>
                <app-input
                  label="Email"
                  type="email"
                  size="lg"
                  autocomplete="email"
                  formControlName="email"
                  [error]="getFieldError('email')"
                />
                <app-input
                  label="Password"
                  type="password"
                  size="lg"
                  autocomplete="current-password"
                  formControlName="password"
                  [error]="getFieldError('password')"
                />
                <div class="auth__aside">
                  <a routerLink="/recupera-password" class="auth__link">Recupera la password</a>
                </div>
                <app-button type="submit" size="lg" extraClass="w-full" [isLoading]="isLoading()">Accedi</app-button>
                <p class="auth__status" role="status">{{ formStatus() }}</p>
              </form>

              <p class="auth__legal">
                Consulta l’<a routerLink="/privacy" class="auth__link">informativa privacy</a> per sapere come
                trattiamo i dati dell’account.
              </p>
            </div>

            <div class="auth__visual frame frame--paper" data-ui role="img"
              aria-label="La giornata di Studio Moretti dopo l’accesso: due richieste da confermare, i prossimi appuntamenti e tre messaggi WhatsApp da leggere">
              <div class="today">
                <div class="today__head">
                  <span class="today__title">Giovedì 19 novembre</span>
                  <span class="today__count"><b>2</b> da confermare</span>
                </div>
                <div class="today__row"><b>09:00</b><span>Giulia Rossi<small>Prima consulenza · Elena Moretti</small></span><span class="tag tag--green">Confermato</span></div>
                <div class="today__row is-sel"><b>10:00</b><span>Marco Bianchi<small>Massaggio decontratturante · Andrea Conti</small></span><span class="tag tag--amber">Da confermare</span></div>
                <div class="today__row"><b>11:30</b><span>Sara Ricci<small>Consulenza di controllo · Elena Moretti</small></span><span class="tag tag--green">Confermato</span></div>
                <div class="today__row"><b>14:00</b><span>Luca Ferri<small>Trattamento viso · Andrea Conti</small></span><span class="tag tag--amber">Da confermare</span></div>
              </div>
              <div class="today-chat">
                <span class="today-chat__label">WhatsApp</span>
                <span class="today-chat__line"><b>3</b> messaggi da leggere</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  `,
  styles: [
    `
      .today {
        width: min(100%, 520px);
        border: 1px solid var(--line);
        border-radius: var(--r-control);
        background: var(--surface);
        font-size: var(--t-small);
      }
      .today__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 16px 20px;
        border-bottom: 1px solid var(--line);
      }
      .today__title { font-size: 18px; font-weight: 600; letter-spacing: -0.015em; }
      .today__count { display: inline-flex; align-items: center; gap: 8px; }
      .today__count b {
        display: inline-grid;
        place-items: center;
        min-width: 22px;
        height: 22px;
        border-radius: var(--r-badge);
        background: var(--attention);
        color: #171a1f;
        font-size: var(--t-label);
      }
      .today__row {
        display: grid;
        grid-template-columns: 52px minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px;
        padding: 12px 20px;
      }
      .today__row + .today__row { border-top: 1px solid var(--line); }
      .today__row.is-sel { background: var(--surface-active-nav); box-shadow: inset 2px 0 0 var(--action); }
      .today__row b { font-weight: 600; }
      .today__row span { display: grid; font-weight: 500; }
      .today__row small { font-size: var(--t-label); font-weight: 400; color: var(--muted); }
      .today-chat {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        width: min(100%, 520px);
        margin-top: 16px;
        padding: 14px 20px;
        border: 1px solid var(--line);
        border-radius: var(--r-control);
        background: var(--surface);
        font-size: var(--t-small);
      }
      .today-chat__label { color: var(--muted); font-size: var(--t-label); }
      .today-chat__line b { font-weight: 600; }
      .auth__visual { align-content: center; }
    `,
  ],
})
export class LoginComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    if (this.authService.isAuthenticated()) {
      const user = this.authService.user();
      const target = user?.role === 'PROFESSIONAL' ? '/pro/dashboard' : '/dashboard';
      this.router.navigate([target], { replaceUrl: true });
    }
  }

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  readonly serverError = signal<string | null>(null);
  readonly isLoading = signal(false);
  readonly formStatus = signal('');

  getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control?.touched || !control.errors) return '';
    if (control.errors['required']) {
      return field === 'email' ? 'Scrivi l’email con cui ti sei registrato' : 'Scrivi la password';
    }
    if (control.errors['email']) return 'Scrivi un indirizzo email completo, con la @';
    return '';
  }

  async onSubmit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      const count = Object.values(this.form.controls).filter((c) => c.invalid).length;
      this.formStatus.set(count === 1 ? 'Controlla il campo evidenziato.' : `Controlla i ${count} campi evidenziati.`);
      this.focusFirstInvalid();
      return;
    }

    this.formStatus.set('');
    this.serverError.set(null);
    this.isLoading.set(true);

    try {
      const { email, password } = this.form.getRawValue();
      const response = await this.authService.loginApi({ email: email!, password: password! });
      this.authService.setAuth(response.accessToken, response.user, response.refreshToken);
      const target = response.user.role === 'PROFESSIONAL' ? '/pro/dashboard' : '/dashboard';
      this.router.navigate([target], { replaceUrl: true });
    } catch (error) {
      if (isApiError(error) && error.error === 'EMAIL_NOT_VERIFIED') {
        const email = this.form.getRawValue().email;
        this.router.navigate(['/verifica-email'], { replaceUrl: true, state: { email, resend: true } });
        return;
      }
      this.serverError.set(getErrorMessage(error));
    } finally {
      this.isLoading.set(false);
    }
  }

  /** After the errors render, the first field that failed takes the focus. */
  private focusFirstInvalid(): void {
    setTimeout(() => this.host.nativeElement.querySelector<HTMLInputElement>('input[aria-invalid="true"]')?.focus());
  }
}
