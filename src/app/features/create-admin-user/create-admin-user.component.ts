import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { SetupService } from '../../core/services/setup.service';
import { getErrorMessage } from '../../shared/utils/errors';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { StepIndicatorComponent } from '../../shared/components/step-indicator/step-indicator.component';

@Component({
  selector: 'app-create-admin-user',
  standalone: true,
  imports: [ReactiveFormsModule, PageShellComponent, CardComponent, ButtonComponent, InputComponent, AlertComponent, StepIndicatorComponent],
  template: `
    <app-page-shell>
      <div class="mx-auto max-w-lg">
        <app-step-indicator [steps]="setupSteps" [currentStep]="1" />
        <app-card>
          <h2 class="mb-1 text-xl font-bold text-gray-900">Create Admin Account</h2>
          <p class="mb-6 text-sm text-gray-500">
            This account will manage <span class="font-semibold text-gray-700">{{ setupService.studio()?.name }}</span>.
          </p>

          @if (serverError()) {
            <div class="mb-4"><app-alert variant="error" [message]="serverError()!" (dismiss)="serverError.set(null)" /></div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-5">
            <app-input label="Admin email" type="email" placeholder="admin@example.com" formControlName="email" [error]="getFieldError('email')" />
            <app-input label="Password" type="password" placeholder="Min. 8 characters" formControlName="password" [error]="getFieldError('password')" />
            <app-button type="submit" [isLoading]="isLoading()">Create Admin User</app-button>
          </form>
        </app-card>
      </div>
    </app-page-shell>
  `,
})
export class CreateAdminUserComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  readonly setupService = inject(SetupService);

  setupSteps = ['Create Studio', 'Create Admin', 'Dashboard'];
  readonly serverError = signal<string | null>(null);
  readonly isLoading = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit(): void {
    if (!this.setupService.studio()) {
      this.router.navigate(['/setup/studio'], { replaceUrl: true });
    }
  }

  getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control?.touched || !control.errors) return '';
    if (control.errors['required']) return field === 'email' ? 'Email is required' : 'Password is required';
    if (control.errors['email']) return 'Enter a valid email';
    if (control.errors['minlength']) return 'Password must be at least 8 characters';
    return '';
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const studio = this.setupService.studio();
    if (!studio) return;

    this.serverError.set(null);
    this.isLoading.set(true);

    const v = this.form.getRawValue();
    this.userService.createAppUser({
      studioId: studio.id,
      email: v.email!,
      password: v.password!,
      role: 'ADMIN',
    }).subscribe({
      next: (user) => {
        this.setupService.setAdminUser(user);
        this.setupService.completeSetup();
        this.router.navigate(['/dashboard']);
      },
      error: (err) => { this.serverError.set(getErrorMessage(err)); this.isLoading.set(false); },
    });
  }
}
