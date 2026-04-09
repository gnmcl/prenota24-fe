import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PublicEventService } from '../../core/services/public-event.service';
import { getErrorMessage } from '../../shared/utils/errors';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import type { EventResponse } from '../../core/models/domain.model';

@Component({
  selector: 'app-public-event',
  standalone: true,
  imports: [ReactiveFormsModule, CardComponent, ButtonComponent, InputComponent, AlertComponent],
  template: `
    @if (isLoading()) {
      <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div class="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    } @else if (!event()) {
      <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4">
        <app-card extraClass="max-w-md text-center">
          <h2 class="text-xl font-bold text-gray-900 mb-2">Evento non trovato</h2>
          <p class="text-gray-500">Il link potrebbe essere errato o l'evento potrebbe essere stato rimosso.</p>
        </app-card>
      </div>
    } @else {
      <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <header class="border-b border-gray-200/60 bg-white/80 backdrop-blur-sm">
          <div class="mx-auto flex h-14 max-w-3xl items-center px-6">
            <span class="text-lg font-bold tracking-tight text-indigo-600">Prenota24</span>
          </div>
        </header>

        <main class="mx-auto max-w-3xl px-6 py-10">
          <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-3">{{ event()!.title }}</h1>
            <div class="flex flex-wrap gap-4 text-sm text-gray-600">
              <span class="flex items-center gap-1.5">📅 {{ formatDate(event()!.eventDate) }}</span>
              <span class="flex items-center gap-1.5">🕐 {{ formatTime(event()!.startTime) }} – {{ formatTime(event()!.endTime) }}</span>
              @if (event()!.location) {
                <span class="flex items-center gap-1.5">📍 {{ event()!.location }}</span>
              }
            </div>
            @if (event()!.description) {
              <p class="mt-4 text-gray-700 leading-relaxed">{{ event()!.description }}</p>
            }

            <div class="mt-6 flex items-center gap-3">
              @if (spotsLeft() !== null) {
                <div [class]="'rounded-full px-4 py-1.5 text-sm font-semibold ' + spotsClass()">
                  {{ isFull() ? '🔴 Posti esauriti' : '🟢 ' + spotsLeft() + ' post' + (spotsLeft() === 1 ? 'o' : 'i') + ' disponibil' + (spotsLeft() === 1 ? 'e' : 'i') }}
                </div>
              } @else {
                <div class="rounded-full bg-green-100 px-4 py-1.5 text-sm font-semibold text-green-700">🟢 Posti disponibili</div>
              }
              <span class="text-sm text-gray-400">{{ event()!.currentParticipants }} prenotat{{ event()!.currentParticipants === 1 ? 'o' : 'i' }}</span>
            </div>
          </div>

          @if (success()) {
            <app-card extraClass="text-center max-w-md mx-auto">
              <div class="text-5xl mb-4">🎉</div>
              <h3 class="text-xl font-bold text-gray-900 mb-2">Prenotazione confermata!</h3>
              <p class="text-gray-500">Hai prenotato il tuo posto per <strong>{{ event()!.title }}</strong>. Ti aspettiamo!</p>
              @if (spotsLeft() !== null && spotsLeft()! > 0) {
                <p class="mt-3 text-sm text-gray-400">Rimangono {{ spotsLeft() }} post{{ spotsLeft() === 1 ? 'o' : 'i' }} disponibil{{ spotsLeft() === 1 ? 'e' : 'i' }}</p>
              }
            </app-card>
          }

          @if (!success() && isOpen()) {
            <app-card extraClass="max-w-md mx-auto">
              <h3 class="text-lg font-bold text-gray-900 mb-1">Prenota il tuo posto</h3>
              <p class="text-sm text-gray-500 mb-5">Compila il form per confermare la tua partecipazione.</p>

              @if (serverError()) {
                <div class="mb-4"><app-alert variant="error" [message]="serverError()!" (dismiss)="serverError.set(null)" /></div>
              }

              <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-5">
                <app-input label="Nome e cognome" type="text" placeholder="Mario Rossi" autocomplete="name" formControlName="guestName" [error]="getFieldError('guestName')" />
                <app-input label="Email" type="email" placeholder="mario@esempio.com" autocomplete="email" formControlName="guestEmail" [error]="getFieldError('guestEmail')" />
                <app-input label="Telefono (opzionale)" type="tel" placeholder="340 1234567" autocomplete="tel" formControlName="guestPhone" />

                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-medium text-gray-700" for="notes">Note (opzionale)</label>
                  <textarea id="notes" rows="2" placeholder="Allergie, richieste speciali..." formControlName="notes"
                    class="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"></textarea>
                </div>

                <!-- Honeypot -->
                <div class="absolute -left-[9999px]" aria-hidden="true">
                  <input type="text" tabindex="-1" autocomplete="off" formControlName="honeypot" />
                </div>

                <app-button type="submit" [isLoading]="submitLoading()">Conferma prenotazione</app-button>
              </form>
            </app-card>
          }

          @if (!success() && !isOpen()) {
            <app-card extraClass="text-center max-w-md mx-auto">
              @if (isFull()) {
                <div class="text-4xl mb-3">😔</div>
                <h3 class="text-lg font-bold text-gray-900 mb-1">Posti esauriti</h3>
                <p class="text-gray-500">Tutti i posti per questo evento sono stati prenotati.</p>
              } @else {
                <div class="text-4xl mb-3">🔒</div>
                <h3 class="text-lg font-bold text-gray-900 mb-1">Prenotazioni chiuse</h3>
                <p class="text-gray-500">Le prenotazioni per questo evento non sono al momento disponibili.</p>
              }
            </app-card>
          }
        </main>
      </div>
    }
  `,
})
export class PublicEventComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly publicEventService = inject(PublicEventService);
  private readonly fb = inject(FormBuilder);

  readonly event = signal<EventResponse | null>(null);
  readonly isLoading = signal(true);
  readonly serverError = signal<string | null>(null);
  readonly success = signal(false);
  readonly submitLoading = signal(false);

  readonly isFull = computed(() => {
    const ev = this.event();
    return ev !== null && ev.maxParticipants !== null && ev.currentParticipants >= ev.maxParticipants;
  });
  readonly isOpen = computed(() => this.event()?.status === 'PUBLISHED' && !this.isFull());
  readonly spotsLeft = computed(() => {
    const ev = this.event();
    return ev?.maxParticipants ? ev.maxParticipants - ev.currentParticipants : null;
  });
  readonly spotsClass = computed(() => {
    if (this.isFull()) return 'bg-red-100 text-red-700';
    const left = this.spotsLeft();
    if (left !== null && left <= 5) return 'bg-amber-100 text-amber-700';
    return 'bg-green-100 text-green-700';
  });

  form = this.fb.group({
    guestName: ['', [Validators.required, Validators.maxLength(200)]],
    guestEmail: ['', [Validators.required, Validators.email]],
    guestPhone: [''],
    notes: [''],
    honeypot: [''],
  });

  private slug = '';

  ngOnInit(): void {
    this.slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.publicEventService.getPublicEvent(this.slug).subscribe({
      next: (ev) => { this.event.set(ev); this.isLoading.set(false); },
      error: () => { this.isLoading.set(false); },
    });
  }

  getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control?.touched || !control.errors) return '';
    if (control.errors['required']) return field === 'guestName' ? 'Il nome è obbligatorio' : "L'email è obbligatoria";
    if (control.errors['email']) return 'Inserisci un indirizzo email valido';
    if (control.errors['maxlength']) return 'Il nome deve avere al massimo 200 caratteri';
    return '';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
  formatTime(t: string): string { return t?.slice(0, 5) ?? ''; }

  onSubmit(): void {
    if (this.form.get('honeypot')?.value) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.serverError.set(null);
    this.submitLoading.set(true);

    const v = this.form.getRawValue();
    this.publicEventService.createReservation(this.slug, {
      guestName: v.guestName!,
      guestEmail: v.guestEmail!,
      guestPhone: v.guestPhone || undefined,
      notes: v.notes || undefined,
    }).subscribe({
      next: () => {
        this.success.set(true);
        this.submitLoading.set(false);
        // Refresh count
        this.publicEventService.getPublicEvent(this.slug).subscribe({
          next: (ev) => this.event.set(ev),
        });
      },
      error: (err) => {
        this.serverError.set(getErrorMessage(err));
        this.submitLoading.set(false);
      },
    });
  }
}
