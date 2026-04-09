import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { StudioService } from '../../core/services/studio.service';
import { SetupService } from '../../core/services/setup.service';
import { getErrorMessage } from '../../shared/utils/errors';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { StepIndicatorComponent } from '../../shared/components/step-indicator/step-indicator.component';

@Component({
  selector: 'app-create-studio',
  standalone: true,
  imports: [ReactiveFormsModule, PageShellComponent, CardComponent, ButtonComponent, InputComponent, AlertComponent, StepIndicatorComponent],
  template: `
    <app-page-shell>
      <div class="mx-auto max-w-lg">
        <app-step-indicator [steps]="setupSteps" [currentStep]="0" />
        <app-card>
          <h2 class="mb-1 text-xl font-bold text-gray-900">Create your Studio</h2>
          <p class="mb-6 text-sm text-gray-500">A Studio is your workspace. All professionals and appointments belong to it.</p>

          @if (serverError) {
            <div class="mb-4"><app-alert variant="error" [message]="serverError" (dismiss)="serverError = null" /></div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-5">
            <app-input label="Studio name" placeholder="e.g. Studio Medico Rossi" formControlName="name" [error]="getFieldError('name')" />
            <app-input label="Email (optional)" type="email" placeholder="studio@example.com" formControlName="email" [error]="getFieldError('email')" />
            <app-input label="Phone (optional)" type="tel" placeholder="+39 02 1234567" formControlName="phone" />
            <app-button type="submit" [isLoading]="isLoading">Create Studio</app-button>
          </form>
        </app-card>
      </div>
    </app-page-shell>
  `,
})
export class CreateStudioComponent {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly studioService = inject(StudioService);
  private readonly setupService = inject(SetupService);

  setupSteps = ['Create Studio', 'Create Admin', 'Dashboard'];
  serverError: string | null = null;
  isLoading = false;

  form = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.email]],
    phone: [''],
  });

  getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control?.touched || !control.errors) return '';
    if (control.errors['required']) return 'Studio name is required';
    if (control.errors['email']) return 'Enter a valid email';
    return '';
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.serverError = null;
    this.isLoading = true;

    const v = this.form.getRawValue();
    this.studioService.createStudio({
      name: v.name!,
      email: v.email || undefined,
      phone: v.phone || undefined,
    }).subscribe({
      next: (studio) => {
        this.setupService.setStudio(studio);
        this.router.navigate(['/setup/admin']);
      },
      error: (err) => { this.serverError = getErrorMessage(err); this.isLoading = false; },
    });
  }
}
