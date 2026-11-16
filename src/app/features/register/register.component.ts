import { Component, ElementRef, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { getErrorMessage } from '../../shared/utils/errors';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { PublicHeaderComponent } from '../../shared/components/public-header/public-header.component';

function matchPasswords(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  if (password && confirmPassword && password.value !== confirmPassword.value) {
    confirmPassword.setErrors({ ...confirmPassword.errors, passwordMismatch: true });
    return { passwordMismatch: true };
  }
  return null;
}

/**
 * Sign up (/registrati), on the public pages' system (src/styles/landing.css): one screen, the form on
 * the left, from 1024px the studio's first setup drawn on the right.
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, InputComponent, AlertComponent, PublicHeaderComponent],
  template: `
    <div class="landing">
      <app-public-header prompt="Hai già un account?" actionLabel="Accedi" actionRoute="/accedi" />

      <main id="top">
        <section class="auth" data-enter aria-labelledby="register-title">
          <div class="wrap auth__grid">
            <div class="auth__form">
              <h1 id="register-title">Crea il tuo studio</h1>
              <p class="auth__lead">Dopo la registrazione confermi l’email, poi configuri servizi, orari e team.</p>

              @if (serverError()) {
                <div class="auth__alert">
                  <app-alert variant="error" [message]="serverError()!" (dismiss)="serverError.set(null)" />
                </div>
              }

              <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth__fields" novalidate>
                <div class="auth__pair">
                  <app-input
                    label="Nome e cognome"
                    type="text"
                    size="lg"
                    autocomplete="name"
                    formControlName="name"
                    [error]="getFieldError('name')"
                  />
                  <app-input
                    label="Nome dello studio"
                    type="text"
                    size="lg"
                    autocomplete="organization"
                    formControlName="studioName"
                    [error]="getFieldError('studioName')"
                  />
                </div>
                <app-input
                  label="Email"
                  type="email"
                  size="lg"
                  autocomplete="email"
                  formControlName="email"
                  [error]="getFieldError('email')"
                />
                <div class="auth__pair">
                  <app-input
                    label="Password"
                    type="password"
                    size="lg"
                    autocomplete="new-password"
                    hint="Almeno 8 caratteri"
                    formControlName="password"
                    [error]="getFieldError('password')"
                  />
                  <app-input
                    label="Ripeti la password"
                    type="password"
                    size="lg"
                    autocomplete="new-password"
                    formControlName="confirmPassword"
                    [error]="getFieldError('confirmPassword')"
                  />
                </div>
                <p class="auth__legal register__privacy">
                  Consulta l’<a routerLink="/privacy" class="auth__link">informativa privacy</a>
                  per sapere come trattiamo i dati necessari alla registrazione.
                </p>
                <app-button type="submit" size="lg" extraClass="w-full" [isLoading]="isLoading()">Crea il tuo studio</app-button>
                <p class="auth__status" role="status">{{ formStatus() }}</p>
              </form>
            </div>

            <div class="auth__visual frame frame--paper" data-ui role="img"
              aria-label="La configurazione di Studio Moretti dopo la registrazione: studio creato, poi servizi, orari del team e pagina di prenotazione">
              <div class="setup">
                <div class="setup__head">
                  <span class="setup__eyebrow">Primi passi</span>
                  <span class="setup__title">Studio Moretti</span>
                </div>
                <ol class="setup__steps">
                  <li class="is-done"><span class="setup__mark" aria-hidden="true"></span><span>Studio creato<small>Email confermata</small></span></li>
                  <li class="is-now"><span class="setup__mark" aria-hidden="true">2</span><span>Servizi e durate<small>Massaggio decontratturante · 50 min</small></span></li>
                  <li><span class="setup__mark" aria-hidden="true">3</span><span>Orari del team<small>Inviti a Elena Moretti e Andrea Conti</small></span></li>
                  <li><span class="setup__mark" aria-hidden="true">4</span><span>Pagina di prenotazione<small>Il link da condividere con i clienti</small></span></li>
                </ol>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  `,
  styles: [
    `
      .register__privacy { margin-top: 0; }
      .auth__form { max-width: none; }
      .setup {
        width: min(100%, 460px);
        border: 1px solid var(--line);
        border-radius: var(--r-control);
        background: var(--surface);
        font-size: var(--t-small);
      }
      .setup__head { display: grid; gap: 2px; padding: 18px 20px; border-bottom: 1px solid var(--line); }
      .setup__eyebrow { font-size: var(--t-label); color: var(--muted); }
      .setup__title { font-size: 20px; font-weight: 600; letter-spacing: -0.015em; }
      .setup__steps { margin: 0; padding: 0; list-style: none; }
      .setup__steps li {
        display: grid;
        grid-template-columns: 28px minmax(0, 1fr);
        align-items: center;
        gap: 14px;
        padding: 14px 20px;
      }
      .setup__steps li + li { border-top: 1px solid var(--line); }
      .setup__steps li > span:last-child { display: grid; font-weight: 500; }
      .setup__steps small { font-size: var(--t-label); font-weight: 400; color: var(--muted); }
      .setup__mark {
        display: grid;
        place-items: center;
        width: 28px;
        height: 28px;
        border: 1px solid var(--line);
        border-radius: var(--r-control);
        font-size: var(--t-label);
        font-weight: 600;
        color: var(--muted);
      }
      .is-done .setup__mark { border-color: var(--status-success-text); background: var(--status-success-bg); }
      .is-done .setup__mark::after {
        content: '';
        width: 10px;
        height: 6px;
        border-left: 2px solid var(--status-success-text);
        border-bottom: 2px solid var(--status-success-text);
        transform: translateY(-1px) rotate(-45deg);
      }
      .is-done > span:last-child { color: var(--muted); }
      .is-now { background: var(--surface-active-nav); box-shadow: inset 2px 0 0 var(--action); }
      .is-now .setup__mark { border-color: var(--action); background: var(--action); color: var(--text-inverted); }
    `,
  ],
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    studioName: ['', [Validators.required, Validators.maxLength(255)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
    confirmPassword: ['', [Validators.required]],
  }, { validators: matchPasswords });

  readonly serverError = signal<string | null>(null);
  readonly isLoading = signal(false);
  readonly formStatus = signal('');

  getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control?.touched || !control.errors) return '';
    if (control.errors['required']) {
      const labels: Record<string, string> = {
        name: 'Scrivi il tuo nome e cognome',
        studioName: 'Scrivi il nome dello studio, come lo vedranno i clienti',
        email: 'Scrivi l’email con cui accederai',
        password: 'Scegli una password di almeno 8 caratteri',
        confirmPassword: 'Ripeti la password',
      };
      return labels[field] || 'Compila questo campo';
    }
    if (control.errors['email']) return 'Scrivi un indirizzo email completo, con la @';
    if (control.errors['minlength']) return 'La password deve avere almeno 8 caratteri';
    if (control.errors['maxlength']) {
      const limits: Record<string, string> = {
        name: 'Il nome può avere al massimo 200 caratteri',
        studioName: 'Il nome dello studio può avere al massimo 255 caratteri',
        password: 'La password può avere al massimo 128 caratteri',
      };
      return limits[field] || 'Il testo è troppo lungo';
    }
    if (control.errors['passwordMismatch']) return 'Le due password non coincidono';
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
      const { name, studioName, email, password } = this.form.getRawValue();
      await this.authService.registerApi({ name: name!, studioName: studioName!, email: email!, password: password! });
      this.router.navigate(['/verifica-email'], { replaceUrl: true, state: { email: email } });
    } catch (error) {
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
