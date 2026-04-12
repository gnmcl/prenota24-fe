import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { ClientService } from '../../core/services/client.service';
import type { ClientResponse } from '../../core/models/domain.model';
import { getErrorMessage } from '../../shared/utils/errors';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, PageShellComponent, CardComponent, InputComponent, ButtonComponent, AlertComponent],
  template: `
    <app-page-shell>
      <div class="mx-auto max-w-2xl">
        <a routerLink="/clienti" class="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Torna alla lista
        </a>

        <h2 class="mb-6 text-2xl font-bold text-gray-900">{{ isEdit() ? 'Modifica cliente' : 'Nuovo cliente' }}</h2>

        @if (error()) {
          <app-alert variant="error" class="mb-6">{{ error() }}</app-alert>
        }

        <app-card>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="grid gap-5 sm:grid-cols-2">
              <app-input label="Nome" formControlName="firstName" [error]="fieldError('firstName')" />
              <app-input label="Cognome" formControlName="lastName" [error]="fieldError('lastName')" />
              <app-input label="Email" type="email" formControlName="email" [error]="fieldError('email')" autocomplete="email" />
              <app-input label="Telefono" type="tel" formControlName="phone" autocomplete="tel" />
            </div>

            <div class="mt-5">
              <label class="text-sm font-medium text-gray-700">Note</label>
              <textarea formControlName="notes" rows="3" placeholder="Note sul cliente..."
                class="mt-1.5 w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none resize-none transition-colors">
              </textarea>
            </div>

            <div class="mt-5">
              <label class="text-sm font-medium text-gray-700">Tag</label>
              <div class="mt-1.5 flex flex-wrap items-center gap-2">
                @for (tag of tags(); track tag) {
                  <span class="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-sm text-indigo-700">
                    {{ tag }}
                    <button type="button" (click)="removeTag(tag)" class="ml-0.5 hover:text-indigo-900">&times;</button>
                  </span>
                }
                <input #tagInput (keydown.enter)="addTag(tagInput); $event.preventDefault()"
                       placeholder="Aggiungi tag..."
                       class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-colors w-36" />
              </div>
            </div>

            <div class="mt-8 flex items-center justify-end gap-3">
              <a routerLink="/clienti">
                <app-button variant="secondary" type="button">Annulla</app-button>
              </a>
              <app-button type="submit" [isLoading]="isSaving()" [disabled]="form.invalid">
                {{ isEdit() ? 'Salva modifiche' : 'Crea cliente' }}
              </app-button>
            </div>
          </form>
        </app-card>
      </div>
    </app-page-shell>
  `,
})
export class ClientFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly clientService = inject(ClientService);

  readonly isEdit = signal(false);
  readonly isSaving = signal(false);
  readonly error = signal('');
  readonly tags = signal<string[]>([]);
  private clientId = '';

  readonly form: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.email]],
    phone: [''],
    notes: [''],
  });

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('id') ?? '';
    if (this.clientId) {
      this.isEdit.set(true);
      this.clientService.getById(this.clientId).subscribe({
        next: (c) => {
          this.form.patchValue({
            firstName: c.firstName,
            lastName: c.lastName,
            email: c.email ?? '',
            phone: c.phone ?? '',
            notes: c.notes ?? '',
          });
          this.tags.set(c.tags ?? []);
        },
        error: () => this.router.navigate(['/clienti']),
      });
    }
  }

  addTag(input: HTMLInputElement): void {
    const val = input.value.trim();
    if (val && !this.tags().includes(val)) {
      this.tags.update((t) => [...t, val]);
    }
    input.value = '';
  }

  removeTag(tag: string): void {
    this.tags.update((t) => t.filter((x) => x !== tag));
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

    const payload = { ...this.form.value, tags: this.tags() };
    const req$ = this.isEdit()
      ? this.clientService.update(this.clientId, payload)
      : this.clientService.create(payload);

    req$.subscribe({
      next: (c) => this.router.navigate(['/clienti', c.id]),
      error: (err) => {
        this.isSaving.set(false);
        this.error.set(getErrorMessage(err));
      },
    });
  }
}
