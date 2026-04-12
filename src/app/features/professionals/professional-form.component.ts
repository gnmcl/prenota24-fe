import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { ProfessionalService } from '../../core/services/professional.service';
import { getErrorMessage } from '../../shared/utils/errors';

@Component({
  selector: 'app-professional-form',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, PageShellComponent, CardComponent, InputComponent, ButtonComponent, AlertComponent],
  template: `
    <app-page-shell>
      <div class="mx-auto max-w-2xl">
        <a routerLink="/professionisti" class="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Torna al team
        </a>

        <h2 class="mb-6 text-2xl font-bold text-gray-900">{{ isEdit() ? 'Modifica professionista' : 'Nuovo professionista' }}</h2>

        @if (error()) {
          <app-alert variant="error" [message]="error()" class="mb-6" />
        }

        <app-card>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="grid gap-5 sm:grid-cols-2">
              <app-input label="Nome" formControlName="firstName" [error]="fieldError('firstName')" />
              <app-input label="Cognome" formControlName="lastName" [error]="fieldError('lastName')" />
              <app-input label="Email" type="email" formControlName="email" [error]="fieldError('email')" autocomplete="email" />
              <app-input label="Telefono" type="tel" formControlName="phone" autocomplete="tel" />
            </div>
            <div class="mt-8 flex items-center justify-end gap-3">
              <a routerLink="/professionisti">
                <app-button variant="secondary" type="button">Annulla</app-button>
              </a>
              <app-button type="submit" [isLoading]="isSaving()" [disabled]="form.invalid">
                {{ isEdit() ? 'Salva modifiche' : 'Aggiungi al team' }}
              </app-button>
            </div>
          </form>
        </app-card>
      </div>
    </app-page-shell>
  `,
})
export class ProfessionalFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly profService = inject(ProfessionalService);

  readonly isEdit = signal(false);
  readonly isSaving = signal(false);
  readonly error = signal('');
  private profId = '';

  readonly form: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.email]],
    phone: [''],
  });

  ngOnInit(): void {
    this.profId = this.route.snapshot.paramMap.get('id') ?? '';
    if (this.profId) {
      this.isEdit.set(true);
      this.profService.getById(this.profId).subscribe({
        next: (p) => this.form.patchValue({ firstName: p.firstName, lastName: p.lastName, email: p.email ?? '', phone: p.phone ?? '' }),
        error: () => this.router.navigate(['/professionisti']),
      });
    }
  }

  fieldError(field: string): string {
    const ctrl = this.form.get(field);
    if (!ctrl?.touched || !ctrl.errors) return '';
    if (ctrl.errors['required']) return 'Campo obbligatorio';
    if (ctrl.errors['minlength']) return `Minimo ${ctrl.errors['minlength'].requiredLength} caratteri`;
    if (ctrl.errors['email']) return 'Email non valida';
    return '';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSaving.set(true);
    this.error.set('');
    const req$ = this.isEdit()
      ? this.profService.update(this.profId, this.form.value)
      : this.profService.create(this.form.value);
    req$.subscribe({
      next: (p) => this.router.navigate(['/professionisti', p.id]),
      error: (err) => {
        this.isSaving.set(false);
        this.error.set(getErrorMessage(err));
      },
    });
  }
}
