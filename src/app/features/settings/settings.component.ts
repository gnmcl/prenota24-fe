import { Component, inject, OnInit, signal } from "@angular/core";
import { ReactiveFormsModule, FormBuilder, Validators } from "@angular/forms";
import { PageShellComponent } from "../../shared/components/page-shell/page-shell.component";
import { CardComponent } from "../../shared/components/card/card.component";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { InputComponent } from "../../shared/components/input/input.component";
import { AlertComponent } from "../../shared/components/alert/alert.component";
import { StudioService } from "../../core/services/studio.service";
import { AuthService } from "../../core/services/auth.service";
import { getErrorMessage } from "../../shared/utils/errors";

type Section = 'account' | 'studio';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ReactiveFormsModule, PageShellComponent, CardComponent, ButtonComponent, InputComponent, AlertComponent],
  template: `
    <app-page-shell>
      <div class="mx-auto max-w-5xl">
        <h1 class="mb-8 text-2xl font-bold text-[var(--text-primary)]">Impostazioni</h1>

        <div class="flex gap-8">
          <!-- Main content -->
          <div class="min-w-0 flex-1">

            <!-- ══ ACCOUNT section ══ -->
            @if (activeSection() === 'account') {

              <!-- Email -->
              <app-card extraClass="mb-6">
                <h2 class="mb-1 text-base font-semibold text-[var(--text-primary)]">Indirizzo email</h2>
                <p class="mb-5 text-sm text-[var(--text-secondary)]">Modifica la email con cui accedi. Richiede la password attuale come conferma.</p>

                @if (emailSuccess()) {
                  <div class="mb-4"><app-alert variant="success" [message]="emailSuccess()!" (dismiss)="emailSuccess.set(null)" /></div>
                }
                @if (emailError()) {
                  <div class="mb-4"><app-alert variant="error" [message]="emailError()!" (dismiss)="emailError.set(null)" /></div>
                }

                <form [formGroup]="emailForm" (ngSubmit)="onChangeEmail()" class="flex flex-col gap-4">
                  <app-input
                    label="Email attuale"
                    [value]="authService.user()?.email ?? ''"
                    [readonly]="true"
                  />
                  <app-input
                    label="Nuova email"
                    type="email"
                    placeholder="nuova@email.com"
                    formControlName="newEmail"
                    [error]="emailFieldError('newEmail')"
                  />
                  <app-input
                    label="Password attuale"
                    type="password"
                    placeholder="••••••••"
                    formControlName="emailPassword"
                    [error]="emailFieldError('emailPassword')"
                  />
                  <div class="flex justify-end pt-1">
                    <app-button type="submit" [isLoading]="isSavingEmail()">Aggiorna email</app-button>
                  </div>
                </form>
              </app-card>

              <!-- Password -->
              <app-card>
                <h2 class="mb-1 text-base font-semibold text-[var(--text-primary)]">Password</h2>
                <p class="mb-5 text-sm text-[var(--text-secondary)]">Scegli una password sicura di almeno 8 caratteri. Effettuerai il logout su tutti gli altri dispositivi.</p>

                @if (passwordSuccess()) {
                  <div class="mb-4"><app-alert variant="success" [message]="passwordSuccess()!" (dismiss)="passwordSuccess.set(null)" /></div>
                }
                @if (passwordError()) {
                  <div class="mb-4"><app-alert variant="error" [message]="passwordError()!" (dismiss)="passwordError.set(null)" /></div>
                }

                <form [formGroup]="passwordForm" (ngSubmit)="onChangePassword()" class="flex flex-col gap-4">
                  <app-input
                    label="Password attuale"
                    type="password"
                    placeholder="••••••••"
                    formControlName="currentPassword"
                    [error]="passwordFieldError('currentPassword')"
                  />
                  <app-input
                    label="Nuova password"
                    type="password"
                    placeholder="••••••••"
                    formControlName="newPassword"
                    [error]="passwordFieldError('newPassword')"
                  />
                  <app-input
                    label="Conferma nuova password"
                    type="password"
                    placeholder="••••••••"
                    formControlName="confirmPassword"
                    [error]="passwordFieldError('confirmPassword')"
                  />
                  <div class="flex justify-end pt-1">
                    <app-button type="submit" [isLoading]="isSavingPassword()">Aggiorna password</app-button>
                  </div>
                </form>
              </app-card>
            }

            <!-- ══ STUDIO section ══ -->
            @if (activeSection() === 'studio') {
              <app-card>
                <h2 class="mb-1 text-base font-semibold text-[var(--text-primary)]">Informazioni studio</h2>
                <p class="mb-5 text-sm text-[var(--text-secondary)]">Modifica i dati di contatto del tuo studio.</p>

                @if (studioLoading()) {
                  <div class="flex justify-center py-8">
                    <div class="h-6 w-6 animate-spin rounded-full border-4 border-[var(--surface-card-border)] border-t-[var(--color-primary)]"></div>
                  </div>
                } @else {
                  @if (studioLoadError()) {
                    <div class="mb-4"><app-alert variant="error" [message]="studioLoadError()!" /></div>
                  }
                  @if (studioSuccess()) {
                    <div class="mb-4"><app-alert variant="success" [message]="studioSuccess()!" (dismiss)="studioSuccess.set(null)" /></div>
                  }
                  @if (studioSaveError()) {
                    <div class="mb-4"><app-alert variant="error" [message]="studioSaveError()!" (dismiss)="studioSaveError.set(null)" /></div>
                  }

                  <form [formGroup]="studioForm" (ngSubmit)="onSubmitStudio()" class="flex flex-col gap-4">
                    <app-input
                      label="Nome studio"
                      type="text"
                      placeholder="Il mio studio"
                      formControlName="name"
                      [error]="studioFieldError('name')"
                    />
                    <app-input
                      label="Email di contatto"
                      type="email"
                      placeholder="studio@esempio.com"
                      formControlName="email"
                    />
                    <app-input
                      label="Telefono"
                      type="tel"
                      placeholder="+39 02 1234567"
                      formControlName="phone"
                    />

                    <div class="mt-2 border-t border-[var(--surface-card-border)] pt-5">
                      <h3 class="mb-1 text-sm font-semibold text-[var(--text-primary)]">Soglie di capacità giornaliera</h3>
                      <p class="mb-4 text-xs text-[var(--text-secondary)]">
                        Imposta un limite massimo e soglie per visualizzare gli indicatori colorati nell'agenda:
                        verde sotto la soglia di avviso, giallo dalla soglia di avviso, rosso dalla soglia critica.
                        La soglia di avviso deve essere inferiore a quella critica.
                      </p>
                      <div class="grid gap-4 sm:grid-cols-3">
                        <app-input
                          label="Massimo appuntamenti/giorno"
                          type="number"
                          placeholder="es. 30"
                          min="1"
                          step="1"
                          formControlName="maxAppointmentsPerDay"
                        />
                        <app-input
                          label="Soglia avviso (giallo)"
                          type="number"
                          placeholder="es. 20"
                          min="1"
                          step="1"
                          formControlName="warningThreshold"
                          [error]="studioForm.hasError('thresholdOrder') && studioForm.touched ? 'Deve essere < soglia critica' : ''"
                        />
                        <app-input
                          label="Soglia critica (rosso)"
                          type="number"
                          placeholder="es. 28"
                          min="1"
                          step="1"
                          formControlName="criticalThreshold"
                        />
                      </div>
                      @if (studioForm.hasError('thresholdOrder') && studioForm.touched) {
                        <p class="mt-2 text-xs text-[var(--status-danger-text)]">La soglia di avviso deve essere strettamente inferiore alla soglia critica.</p>
                      }
                    </div>

                    <div class="flex justify-end pt-1">
                      <app-button type="submit" [isLoading]="isSavingStudio()">Salva modifiche</app-button>
                    </div>
                  </form>
                }
              </app-card>
            }
          </div>

          <!-- Right sticky nav -->
          <div class="hidden shrink-0 lg:block" style="width: 140px">
            <div class="sticky top-24 flex flex-col gap-1">
              @for (section of sections; track section.key) {
                <button
                  type="button"
                  (click)="activeSection.set(section.key)"
                  [class]="navButtonClass(section.key)"
                >
                  {{ section.label }}
                </button>
              }
            </div>
          </div>
        </div>
      </div>
    </app-page-shell>
  `,
})
export class SettingsComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly studioService = inject(StudioService);
  private readonly fb = inject(FormBuilder);

  readonly activeSection = signal<Section>('account');

  readonly sections: { key: Section; label: string }[] = [
    { key: 'account', label: 'Account' },
    { key: 'studio', label: 'Studio' },
  ];

  // ── Account: email ─────────────────────────────────────────────
  readonly isSavingEmail = signal(false);
  readonly emailSuccess = signal<string | null>(null);
  readonly emailError = signal<string | null>(null);

  readonly emailForm = this.fb.group({
    newEmail: ['', [Validators.required, Validators.email]],
    emailPassword: ['', Validators.required],
  });

  // ── Account: password ───────────────────────────────────────────
  readonly isSavingPassword = signal(false);
  readonly passwordSuccess = signal<string | null>(null);
  readonly passwordError = signal<string | null>(null);

  readonly passwordForm = this.fb.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: this.passwordsMatchValidator }
  );

  // ── Studio ──────────────────────────────────────────────────────
  readonly studioLoading = signal(true);
  readonly isSavingStudio = signal(false);
  readonly studioLoadError = signal<string | null>(null);
  readonly studioSaveError = signal<string | null>(null);
  readonly studioSuccess = signal<string | null>(null);

  readonly studioForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(255)]],
    email: [''],
    phone: [''],
    maxAppointmentsPerDay: [null as number | null],
    warningThreshold: [null as number | null],
    criticalThreshold: [null as number | null],
  }, { validators: this.thresholdOrderValidator });

  ngOnInit(): void {
    const studioId = this.authService.user()!.studioId;
    this.studioService.getMyStudio(studioId).subscribe({
      next: (studio) => {
        this.studioForm.patchValue({
          name: studio.name,
          email: studio.email ?? '',
          phone: studio.phone ?? '',
          maxAppointmentsPerDay: studio.maxAppointmentsPerDay ?? null,
          warningThreshold: studio.warningThreshold ?? null,
          criticalThreshold: studio.criticalThreshold ?? null,
        });
        this.studioLoading.set(false);
      },
      error: (err) => {
        this.studioLoadError.set(getErrorMessage(err));
        this.studioLoading.set(false);
      },
    });
  }

  async onChangeEmail(): Promise<void> {
    this.emailForm.markAllAsTouched();
    if (this.emailForm.invalid) return;

    this.emailError.set(null);
    this.emailSuccess.set(null);
    this.isSavingEmail.set(true);

    const { newEmail, emailPassword } = this.emailForm.getRawValue();
    try {
      await this.authService.changeEmail(emailPassword!, newEmail!);
      this.emailSuccess.set('Email aggiornata con successo.');
      this.emailForm.reset();
    } catch (err) {
      this.emailError.set(getErrorMessage(err));
    } finally {
      this.isSavingEmail.set(false);
    }
  }

  async onChangePassword(): Promise<void> {
    this.passwordForm.markAllAsTouched();
    if (this.passwordForm.invalid) return;

    this.passwordError.set(null);
    this.passwordSuccess.set(null);
    this.isSavingPassword.set(true);

    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    try {
      await this.authService.changePassword(currentPassword!, newPassword!);
      this.passwordSuccess.set('Password aggiornata. Potresti dover accedere di nuovo su altri dispositivi.');
      this.passwordForm.reset();
    } catch (err) {
      this.passwordError.set(getErrorMessage(err));
    } finally {
      this.isSavingPassword.set(false);
    }
  }

  onSubmitStudio(): void {
    this.studioForm.markAllAsTouched();
    if (this.studioForm.invalid) return;

    this.studioSaveError.set(null);
    this.studioSuccess.set(null);
    this.isSavingStudio.set(true);

    const { name, email, phone, maxAppointmentsPerDay, warningThreshold, criticalThreshold } = this.studioForm.getRawValue();
    const toNum = (v: number | null | undefined) => (v !== null && v !== undefined && v !== ('' as unknown as number) ? Number(v) : undefined);
    this.studioService.editStudio({
      name: name ?? undefined,
      email: email || undefined,
      phone: phone || undefined,
      maxAppointmentsPerDay: toNum(maxAppointmentsPerDay),
      warningThreshold: toNum(warningThreshold),
      criticalThreshold: toNum(criticalThreshold),
    }).subscribe({
      next: () => {
        this.studioSuccess.set('Modifiche salvate con successo.');
        this.isSavingStudio.set(false);
      },
      error: (err) => {
        this.studioSaveError.set(getErrorMessage(err));
        this.isSavingStudio.set(false);
      },
    });
  }

  navButtonClass(key: Section): string {
    const base = 'w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors';
    return this.activeSection() === key
      ? `${base} bg-[var(--color-primary)] text-[var(--text-inverted)]`
      : `${base} text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]`;
  }

  emailFieldError(field: string): string {
    const control = this.emailForm.get(field);
    if (!control?.touched || !control.errors) return '';
    if (control.errors['required']) return 'Campo obbligatorio';
    if (control.errors['email']) return 'Inserisci un indirizzo email valido';
    return '';
  }

  passwordFieldError(field: string): string {
    const control = this.passwordForm.get(field);
    if (!control?.touched || !control.errors) return '';
    if (control.errors['required']) return 'Campo obbligatorio';
    if (control.errors['minlength']) return 'Almeno 8 caratteri';
    if (control.errors['passwordsMismatch']) return 'Le password non coincidono';
    return '';
  }

  studioFieldError(field: string): string {
    const control = this.studioForm.get(field);
    if (!control?.touched || !control.errors) return '';
    if (control.errors['required'] || control.errors['minlength']) return 'Il nome è obbligatorio';
    if (control.errors['maxlength']) return 'Massimo 255 caratteri';
    return '';
  }

  private passwordsMatchValidator(group: import('@angular/forms').AbstractControl) {
    const newPwd = group.get('newPassword')?.value;
    const confirm = group.get('confirmPassword')?.value;
    if (newPwd && confirm && newPwd !== confirm) {
      group.get('confirmPassword')?.setErrors({ passwordsMismatch: true });
      return { passwordsMismatch: true };
    }
    const confirmCtrl = group.get('confirmPassword');
    if (confirmCtrl?.errors?.['passwordsMismatch']) {
      confirmCtrl.setErrors(null);
    }
    return null;
  }

  private thresholdOrderValidator(group: import('@angular/forms').AbstractControl) {
    const warn = group.get('warningThreshold')?.value;
    const crit = group.get('criticalThreshold')?.value;
    if (warn !== null && warn !== '' && crit !== null && crit !== '' && Number(warn) >= Number(crit)) {
      return { thresholdOrder: true };
    }
    return null;
  }
}
