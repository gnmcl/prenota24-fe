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

const TIMEZONES = [
  'Europe/Rome',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Asia/Tokyo',
  'Asia/Dubai',
  'Australia/Sydney',
  'UTC',
];

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ReactiveFormsModule, PageShellComponent, CardComponent, ButtonComponent, InputComponent, AlertComponent],
  template: `
    <app-page-shell>
      <div class="mx-auto max-w-2xl pt-12">
        <h1 class="text-3xl font-bold text-gray-900 mb-8">Impostazioni</h1>

        <app-card>
          <h2 class="text-xl font-semibold text-gray-800 mb-6">Informazioni studio</h2>

          @if (loadError()) {
            <app-alert variant="error" [message]="loadError()!" class="mb-4" />
          }

          @if (isLoading()) {
            <div class="flex justify-center py-8">
              <svg class="animate-spin h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            </div>
          } @else {
            @if (successMessage()) {
              <div class="mb-4">
                <app-alert variant="success" [message]="successMessage()!" (dismiss)="successMessage.set(null)" />
              </div>
            }
            @if (saveError()) {
              <div class="mb-4">
                <app-alert variant="error" [message]="saveError()!" (dismiss)="saveError.set(null)" />
              </div>
            }

            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-5">
              <app-input
                label="Nome studio"
                type="text"
                placeholder="Il mio studio"
                formControlName="name"
                [error]="getFieldError('name')"
              />

              <app-input
                label="Email"
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

              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium text-gray-700">Fuso orario</label>
                <select
                  formControlName="timezone"
                  class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  @for (tz of timezones; track tz) {
                    <option [value]="tz">{{ tz }}</option>
                  }
                </select>
              </div>

              <div class="flex justify-end pt-2">
                <app-button type="submit" [isLoading]="isSaving()">Salva modifiche</app-button>
              </div>
            </form>
          }
        </app-card>
      </div>
    </app-page-shell>
  `,
})
export class SettingsComponent implements OnInit {
  private readonly studioService = inject(StudioService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly timezones = TIMEZONES;

  isLoading = signal(true);
  isSaving = signal(false);
  loadError = signal<string | null>(null);
  saveError = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(255)]],
    email: [''],
    phone: [''],
    timezone: ['Europe/Rome'],
  });

  ngOnInit(): void {
    const studioId = this.authService.user()!.studioId;
    this.studioService.getMyStudio(studioId).subscribe({
      next: (studio) => {
        this.form.patchValue({
          name: studio.name,
          email: studio.email ?? '',
          phone: studio.phone ?? '',
          timezone: studio.timezone,
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        this.loadError.set(getErrorMessage(err));
        this.isLoading.set(false);
      },
    });
  }

  getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control?.touched || !control.errors) return '';
    if (control.errors['required'] || control.errors['minlength']) return 'Il nome è obbligatorio';
    if (control.errors['maxlength']) return 'Massimo 255 caratteri';
    return '';
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.saveError.set(null);
    this.successMessage.set(null);
    this.isSaving.set(true);

    const { name, email, phone, timezone } = this.form.getRawValue();
    this.studioService.editStudio({
      name: name ?? undefined,
      email: email || undefined,
      phone: phone || undefined,
      timezone: timezone ?? undefined,
    }).subscribe({
      next: () => {
        this.successMessage.set('Modifiche salvate con successo.');
        this.isSaving.set(false);
      },
      error: (err) => {
        this.saveError.set(getErrorMessage(err));
        this.isSaving.set(false);
      },
    });
  }
}