import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { EventService } from '../../core/services/event.service';
import { getErrorMessage } from '../../shared/utils/errors';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';

@Component({
  selector: 'app-create-event',
  standalone: true,
  imports: [ReactiveFormsModule, PageShellComponent, CardComponent, ButtonComponent, InputComponent, AlertComponent],
  template: `
    <app-page-shell>
      <div class="mx-auto max-w-lg">
        <div class="mb-8">
          <button (click)="router.navigate(['/eventi'])" class="mb-2 text-sm text-indigo-600 hover:text-indigo-500 font-medium">← Torna ai tuoi eventi</button>
          <h2 class="text-2xl font-bold text-gray-900">Crea nuovo evento</h2>
          <p class="mt-1 text-sm text-gray-500">Compila i dettagli del tuo evento. Potrai pubblicarlo dopo averlo creato.</p>
        </div>

        @if (form.get('title')?.value) {
          <div class="mb-6 rounded-lg bg-indigo-50 border border-indigo-100 px-4 py-3 text-sm">
            <span class="text-indigo-600 font-medium">Link anteprima: </span>
            <span class="text-indigo-900 font-mono">/e/{{ slugPreview }}-xxx</span>
          </div>
        }

        <app-card>
          @if (serverError) {
            <div class="mb-4">
              <app-alert variant="error" [message]="serverError" (dismiss)="serverError = null" />
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-5">
            <app-input label="Titolo" type="text" placeholder="es. Cena in Montagna" formControlName="title" [error]="getFieldError('title')" />

            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-gray-700" for="description">Descrizione (opzionale)</label>
              <textarea id="description" rows="3" placeholder="Descrivi il tuo evento..." formControlName="description"
                class="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"></textarea>
            </div>

            <app-input label="Data evento" type="date" [min]="today" formControlName="eventDate" [error]="getFieldError('eventDate')" />

            <div class="grid grid-cols-2 gap-4">
              <app-input label="Ora inizio" type="time" step="900" formControlName="startTime" [error]="getFieldError('startTime')" />
              <app-input label="Ora fine" type="time" step="900" [min]="form.get('startTime')?.value || ''" formControlName="endTime" [error]="getFieldError('endTime')" />
            </div>

            @if (form.get('eventDate')?.value && form.get('startTime')?.value) {
              <div class="rounded-lg bg-gray-50 border border-gray-100 px-4 py-2.5 text-sm text-gray-600">
                📅 {{ formatDatePreview() }}
                @if (form.get('startTime')?.value) { <span> • 🕐 dalle {{ form.get('startTime')?.value }}</span> }
                @if (form.get('endTime')?.value) { <span> alle {{ form.get('endTime')?.value }}</span> }
              </div>
            }

            <app-input label="Luogo (opzionale)" type="text" placeholder="es. Rifugio Monte Bianco o Online" formControlName="location" [error]="getFieldError('location')" />
            <app-input label="Posti massimi (opzionale)" type="number" placeholder="Lascia vuoto per posti illimitati" min="1" formControlName="maxParticipants" [error]="getFieldError('maxParticipants')" />

            <div class="flex gap-3 pt-2">
              <app-button type="button" variant="secondary" (click)="router.navigate(['/eventi'])" extraClass="flex-1">Annulla</app-button>
              <app-button type="submit" [isLoading]="isLoading" extraClass="flex-1">Crea evento</app-button>
            </div>
          </form>
        </app-card>
      </div>
    </app-page-shell>
  `,
})
export class CreateEventComponent {
  readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly eventService = inject(EventService);

  today = new Date().toISOString().slice(0, 10);
  serverError: string | null = null;
  isLoading = false;

  form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(255)]],
    description: [''],
    eventDate: ['', [Validators.required]],
    startTime: ['', [Validators.required]],
    endTime: ['', [Validators.required]],
    location: ['', [Validators.maxLength(255)]],
    maxParticipants: [''],
  });

  get slugPreview(): string {
    const title = this.form.get('title')?.value || '';
    return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-{2,}/g, '-');
  }

  getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control?.touched || !control.errors) return '';
    if (control.errors['required']) {
      const labels: Record<string, string> = { title: 'Il titolo è obbligatorio', eventDate: 'La data è obbligatoria', startTime: "L'orario di inizio è obbligatorio", endTime: "L'orario di fine è obbligatorio" };
      return labels[field] || 'Campo obbligatorio';
    }
    if (control.errors['maxlength']) return `Massimo ${control.errors['maxlength'].requiredLength} caratteri`;
    return '';
  }

  formatDatePreview(): string {
    const dateStr = this.form.get('eventDate')?.value;
    if (!dateStr) return '';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  onSubmit(): void {
    this.form.markAllAsTouched();

    const startTime = this.form.get('startTime')?.value;
    const endTime = this.form.get('endTime')?.value;
    if (startTime && endTime && startTime >= endTime) {
      this.serverError = "L'orario di fine deve essere dopo l'orario di inizio";
      return;
    }

    if (this.form.invalid) return;

    this.serverError = null;
    this.isLoading = true;

    const v = this.form.getRawValue();
    const maxP = v.maxParticipants ? parseInt(v.maxParticipants, 10) : undefined;

    this.eventService.createEvent({
      title: v.title!,
      description: v.description || undefined,
      eventDate: v.eventDate!,
      startTime: v.startTime!,
      endTime: v.endTime!,
      location: v.location || undefined,
      maxParticipants: maxP && !isNaN(maxP) && maxP > 0 ? maxP : undefined,
    }).subscribe({
      next: (event) => {
        this.router.navigate(['/eventi', event.id], { replaceUrl: true });
      },
      error: (error) => {
        this.serverError = getErrorMessage(error);
        this.isLoading = false;
      },
    });
  }
}
