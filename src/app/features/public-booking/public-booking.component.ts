import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { PublicBookingService } from '../../core/services/public-booking.service';
import { getErrorMessage } from '../../shared/utils/errors';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { StepIndicatorComponent } from '../../shared/components/step-indicator/step-indicator.component';
import type {
  StudioPublicResponse,
  ServiceTypeResponse,
  ProfessionalResponse,
  TimeSlotResponse,
  UUID,
} from '../../core/models/domain.model';

@Component({
  selector: 'app-public-booking',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CardComponent,
    ButtonComponent,
    InputComponent,
    AlertComponent,
    StepIndicatorComponent,
  ],
  template: `
    @if (isLoading()) {
      <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div class="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    } @else if (!studio()) {
      <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4">
        <app-card extraClass="max-w-md text-center">
          <h2 class="text-xl font-bold text-gray-900 mb-2">Studio non trovato</h2>
          <p class="text-gray-500">Il link potrebbe essere errato o lo studio non è più disponibile.</p>
        </app-card>
      </div>
    } @else {
      <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">

        <!-- Header -->
        <header class="border-b border-gray-200/60 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div class="mx-auto flex h-14 max-w-3xl items-center px-6">
            <span class="text-lg font-bold tracking-tight text-indigo-600">Prenota24</span>
            <span class="mx-3 text-gray-300">|</span>
            <span class="text-sm font-medium text-gray-700 truncate">{{ studio()!.name }}</span>
          </div>
        </header>

        <main class="mx-auto max-w-3xl px-6 py-10">

          @if (success()) {
            <!-- ── Success ── -->
            <app-card extraClass="max-w-md mx-auto text-center">
              <div class="text-5xl mb-4">🎉</div>
              <h3 class="text-xl font-bold text-gray-900 mb-2">Richiesta inviata!</h3>
              <p class="text-gray-500 mb-4">
                Il tuo appuntamento per
                <strong>{{ selectedService()!.name }}</strong> con
                <strong>{{ selectedProfessional()!.firstName }} {{ selectedProfessional()!.lastName }}</strong>
                è stato richiesto con successo.
              </p>
              @if (confirmedSlot()) {
                <div class="rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-700 font-medium">
                  📅 {{ formatSlotDisplay(confirmedSlot()!.start) }}
                </div>
              }
              <p class="mt-4 text-xs text-gray-400">Lo studio ti contatterà per confermare l'appuntamento.</p>
            </app-card>

          } @else {
            <!-- ── Page title ── -->
            <div class="mb-8">
              <h1 class="text-2xl font-bold text-gray-900">Prenota un appuntamento</h1>
              <p class="text-sm text-gray-500 mt-1">{{ studio()!.name }}</p>
            </div>

            <!-- ── Step indicator ── -->
            <app-step-indicator [steps]="stepLabels" [currentStep]="step()" />

            @if (serverError()) {
              <div class="mb-6">
                <app-alert variant="error" [message]="serverError()!" (dismiss)="serverError.set(null)" />
              </div>
            }

            <!-- ══ STEP 0: Select service ══ -->
            @if (step() === 0) {
              @if (services().length === 0) {
                <p class="text-gray-500">Nessun servizio disponibile al momento.</p>
              } @else {
                <div class="grid gap-4 sm:grid-cols-2">
                  @for (service of services(); track service.id) {
                    <button
                      type="button"
                      (click)="selectService(service)"
                      class="text-left rounded-2xl border border-gray-200 bg-white p-5 shadow-sm
                             hover:border-indigo-400 hover:shadow-md transition-all
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      <div class="flex items-start gap-3">
                        <span
                          class="mt-1 h-3 w-3 rounded-full flex-shrink-0"
                          [style.background-color]="service.color ?? '#6366f1'"
                        ></span>
                        <div class="flex-1 min-w-0">
                          <p class="font-semibold text-gray-900 truncate">{{ service.name }}</p>
                          <p class="text-sm text-gray-500 mt-0.5">
                            {{ service.durationMinutes }} min
                            @if (service.price) {
                              · <span class="font-medium text-gray-700">€{{ formatPrice(service.price) }}</span>
                            }
                          </p>
                          @if (service.description) {
                            <p class="text-xs text-gray-400 mt-1 line-clamp-2">{{ service.description }}</p>
                          }
                        </div>
                        <span class="text-gray-300 text-lg flex-shrink-0">›</span>
                      </div>
                    </button>
                  }
                </div>
              }
            }

            <!-- ══ STEP 1: Select professional ══ -->
            @else if (step() === 1) {
              <div class="grid gap-4 sm:grid-cols-2">
                @for (prof of availableProfessionals(); track prof.id) {
                  <button
                    type="button"
                    (click)="selectProfessional(prof)"
                    class="text-left rounded-2xl border border-gray-200 bg-white p-5 shadow-sm
                           hover:border-indigo-400 hover:shadow-md transition-all
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    <div class="flex items-center gap-4">
                      <span class="flex h-12 w-12 items-center justify-center rounded-full
                                   bg-indigo-100 text-indigo-700 font-bold text-sm flex-shrink-0">
                        {{ initials(prof) }}
                      </span>
                      <div class="flex-1 min-w-0">
                        <p class="font-semibold text-gray-900 truncate">
                          {{ prof.firstName }} {{ prof.lastName }}
                        </p>
                        <p class="text-xs text-gray-400 mt-0.5 truncate">{{ selectedService()!.name }}</p>
                      </div>
                      <span class="text-gray-300 text-lg flex-shrink-0">›</span>
                    </div>
                  </button>
                }
              </div>
              <div class="mt-6">
                <app-button variant="secondary" (click)="goBack()">← Indietro</app-button>
              </div>
            }

            <!-- ══ STEP 2: Date & time ══ -->
            @else if (step() === 2) {
              <app-card>
                <!-- Selection summary -->
                <div class="flex items-center gap-2 mb-6 pb-5 border-b border-gray-100">
                  <span
                    class="h-2.5 w-2.5 rounded-full flex-shrink-0"
                    [style.background-color]="selectedService()!.color ?? '#6366f1'"
                  ></span>
                  <span class="text-sm font-medium text-gray-700">{{ selectedService()!.name }}</span>
                  <span class="text-gray-300 mx-1">·</span>
                  <span class="flex h-6 w-6 items-center justify-center rounded-full
                               bg-indigo-100 text-indigo-700 text-xs font-bold flex-shrink-0">
                    {{ initials(selectedProfessional()!) }}
                  </span>
                  <span class="text-sm text-gray-600">
                    {{ selectedProfessional()!.firstName }} {{ selectedProfessional()!.lastName }}
                  </span>
                </div>

                <!-- Date picker -->
                <label class="block text-sm font-medium text-gray-700 mb-2" for="date-picker">
                  Scegli il giorno
                </label>
                <input
                  id="date-picker"
                  type="date"
                  [min]="todayStr"
                  [value]="selectedDate()"
                  (change)="onDateChange($event)"
                  class="block w-full max-w-xs rounded-lg border border-gray-300 px-3.5 py-2.5
                         text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2
                         focus:ring-indigo-500 mb-6"
                />

                @if (selectedDate()) {
                  @if (slotsLoading()) {
                    <div class="flex items-center gap-2 text-sm text-gray-500">
                      <div class="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600"></div>
                      Caricamento orari disponibili...
                    </div>
                  } @else if (slots().length === 0) {
                    <div class="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
                      Nessun orario disponibile per questa data. Prova a scegliere un altro giorno.
                    </div>
                  } @else {
                    <p class="text-sm font-medium text-gray-700 mb-3">Orari disponibili</p>
                    <div class="flex flex-wrap gap-2">
                      @for (slot of slots(); track slot.start) {
                        <button
                          type="button"
                          (click)="selectSlot(slot)"
                          [class]="slotButtonClass(slot)"
                        >
                          {{ formatSlotTime(slot.start) }}
                        </button>
                      }
                    </div>
                  }
                }
              </app-card>

              <div class="mt-6">
                <app-button variant="secondary" (click)="goBack()">← Indietro</app-button>
              </div>
            }

            <!-- ══ STEP 3: Client details ══ -->
            @else if (step() === 3) {
              <app-card>
                <!-- Summary bar -->
                <div class="rounded-lg bg-indigo-50 border border-indigo-100 px-4 py-3 mb-6 text-sm">
                  <div class="flex flex-wrap gap-x-4 gap-y-1 text-indigo-700">
                    <span class="font-medium">{{ selectedService()!.name }}</span>
                    <span class="text-indigo-400">·</span>
                    <span>{{ selectedProfessional()!.firstName }} {{ selectedProfessional()!.lastName }}</span>
                    <span class="text-indigo-400">·</span>
                    <span>📅 {{ formatSlotDisplay(selectedSlot()!.start) }}</span>
                  </div>
                </div>

                <h3 class="text-base font-semibold text-gray-900 mb-1">I tuoi dati</h3>
                <p class="text-sm text-gray-500 mb-5">Inserisci le tue informazioni per completare la richiesta.</p>

                <form [formGroup]="detailsForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-5">

                  <div class="grid gap-5 sm:grid-cols-2">
                    <app-input
                      label="Nome"
                      type="text"
                      placeholder="Mario"
                      autocomplete="given-name"
                      formControlName="firstName"
                      [error]="getFieldError('firstName')"
                    />
                    <app-input
                      label="Cognome"
                      type="text"
                      placeholder="Rossi"
                      autocomplete="family-name"
                      formControlName="lastName"
                      [error]="getFieldError('lastName')"
                    />
                  </div>

                  <div class="grid gap-5 sm:grid-cols-2">
                    <app-input
                      label="Email"
                      type="email"
                      placeholder="mario@esempio.com"
                      autocomplete="email"
                      formControlName="email"
                      [error]="getFieldError('email')"
                    />
                    <app-input
                      label="Telefono (opzionale)"
                      type="tel"
                      placeholder="340 1234567"
                      autocomplete="tel"
                      formControlName="phone"
                    />
                  </div>

                  <div class="flex flex-col gap-1.5">
                    <label class="text-sm font-medium text-[var(--text-secondary)]" for="booking-notes">
                      Note (opzionale)
                    </label>
                    <textarea
                      id="booking-notes"
                      rows="3"
                      placeholder="Allergie, richieste speciali, o qualsiasi informazione utile..."
                      formControlName="notes"
                      class="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm
                             text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none
                             focus:ring-2 focus:ring-indigo-500 resize-none"
                    ></textarea>
                  </div>

                  <!-- Honeypot anti-spam -->
                  <div class="absolute -left-[9999px]" aria-hidden="true">
                    <input type="text" tabindex="-1" autocomplete="off" formControlName="honeypot" />
                  </div>

                  <div class="flex items-center justify-between gap-4 pt-2 border-t border-gray-100">
                    <app-button variant="secondary" type="button" (click)="goBack()">
                      ← Indietro
                    </app-button>
                    <app-button type="submit" [isLoading]="submitLoading()">
                      Invia richiesta
                    </app-button>
                  </div>

                </form>
              </app-card>
            }

          }
        </main>
      </div>
    }
  `,
})
export class PublicBookingComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly bookingService = inject(PublicBookingService);
  private readonly fb = inject(FormBuilder);

  private studioSlug = '';

  readonly studio = signal<StudioPublicResponse | null>(null);
  readonly services = signal<ServiceTypeResponse[]>([]);
  readonly isLoading = signal(true);
  readonly serverError = signal<string | null>(null);
  readonly success = signal(false);
  readonly submitLoading = signal(false);
  readonly slotsLoading = signal(false);
  readonly slots = signal<TimeSlotResponse[]>([]);

  readonly step = signal(0);
  readonly selectedService = signal<ServiceTypeResponse | null>(null);
  readonly selectedProfessional = signal<ProfessionalResponse | null>(null);
  readonly selectedDate = signal('');
  readonly selectedSlot = signal<TimeSlotResponse | null>(null);
  readonly confirmedSlot = signal<TimeSlotResponse | null>(null);

  readonly stepLabels = ['Servizio', 'Professionista', 'Data e orario', 'I tuoi dati'];

  readonly availableProfessionals = computed((): ProfessionalResponse[] => {
    const svc = this.selectedService();
    const allProfs = this.studio()?.professionals ?? [];
    if (!svc?.professionalIds?.length) return allProfs;
    return allProfs.filter(p => svc.professionalIds.includes(p.id as UUID));
  });

  detailsForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    phone: [''],
    notes: [''],
    honeypot: [''],
  });

  get todayStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.studioSlug = this.route.snapshot.paramMap.get('studioSlug') ?? '';

    forkJoin([
      this.bookingService.getStudio(this.studioSlug),
      this.bookingService.getServices(this.studioSlug),
    ]).subscribe({
      next: ([studio, services]) => {
        this.studio.set(studio);
        this.services.set(services.filter(s => s.active));
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  selectService(service: ServiceTypeResponse): void {
    this.selectedService.set(service);
    this.selectedProfessional.set(null);
    this.selectedDate.set('');
    this.slots.set([]);
    this.selectedSlot.set(null);

    const profs = this.availableProfessionals();
    if (profs.length === 1) {
      this.selectedProfessional.set(profs[0]);
      this.step.set(2);
    } else {
      this.step.set(1);
    }
  }

  selectProfessional(prof: ProfessionalResponse): void {
    this.selectedProfessional.set(prof);
    this.selectedDate.set('');
    this.slots.set([]);
    this.selectedSlot.set(null);
    this.step.set(2);
  }

  onDateChange(event: Event): void {
    const date = (event.target as HTMLInputElement).value;
    this.selectedDate.set(date);
    this.selectedSlot.set(null);
    this.slots.set([]);

    if (!date) return;

    const prof = this.selectedProfessional()!;
    const svc = this.selectedService();

    this.slotsLoading.set(true);
    this.serverError.set(null);
    this.bookingService.getSlots(
      this.studioSlug,
      prof.id as UUID,
      date,
      svc?.id as UUID | undefined,
    ).subscribe({
      next: slots => {
        this.slots.set(slots);
        this.slotsLoading.set(false);
      },
      error: err => {
        this.serverError.set(getErrorMessage(err));
        this.slotsLoading.set(false);
      },
    });
  }

  selectSlot(slot: TimeSlotResponse): void {
    this.selectedSlot.set(slot);
    this.step.set(3);
  }

  goBack(): void {
    const currentStep = this.step();
    if (currentStep === 1) {
      this.selectedService.set(null);
      this.selectedProfessional.set(null);
      this.step.set(0);
    } else if (currentStep === 2) {
      this.selectedDate.set('');
      this.slots.set([]);
      this.selectedSlot.set(null);
      const profs = this.availableProfessionals();
      if (profs.length > 1) {
        this.step.set(1);
      } else {
        this.selectedService.set(null);
        this.selectedProfessional.set(null);
        this.step.set(0);
      }
    } else if (currentStep === 3) {
      this.selectedSlot.set(null);
      this.step.set(2);
    }
  }

  onSubmit(): void {
    this.detailsForm.markAllAsTouched();
    if (this.detailsForm.invalid || this.detailsForm.value.honeypot) return;

    const { firstName, lastName, email, phone, notes } = this.detailsForm.value;
    const slot = this.selectedSlot()!;
    const prof = this.selectedProfessional()!;
    const svc = this.selectedService();

    this.submitLoading.set(true);
    this.serverError.set(null);

    this.bookingService.createAppointment(this.studioSlug, {
      professionalId: prof.id as UUID,
      serviceTypeId: svc?.id as UUID | undefined,
      startDatetime: slot.start,
      endDatetime: slot.end,
      clientFirstName: firstName!,
      clientLastName: lastName!,
      clientEmail: email!,
      clientPhone: phone || undefined,
      notes: notes || undefined,
    }).subscribe({
      next: () => {
        this.confirmedSlot.set(slot);
        this.success.set(true);
        this.submitLoading.set(false);
      },
      error: err => {
        this.serverError.set(getErrorMessage(err));
        this.submitLoading.set(false);
      },
    });
  }

  formatSlotTime(iso: string): string {
    return new Intl.DateTimeFormat('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: this.studio()?.timezone ?? 'Europe/Rome',
    }).format(new Date(iso));
  }

  formatSlotDisplay(iso: string): string {
    return new Intl.DateTimeFormat('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: this.studio()?.timezone ?? 'Europe/Rome',
    }).format(new Date(iso));
  }

  formatPrice(price: number): string {
    return price % 1 === 0 ? price.toString() : price.toFixed(2);
  }

  slotButtonClass(slot: TimeSlotResponse): string {
    const isSelected = this.selectedSlot()?.start === slot.start;
    const base = 'rounded-lg border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500';
    return isSelected
      ? `${base} bg-indigo-600 text-white border-indigo-600`
      : `${base} bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:text-indigo-600`;
  }

  getFieldError(field: string): string {
    const control = this.detailsForm.get(field);
    if (!control?.errors || !control.touched) return '';
    if (control.errors['required']) return 'Campo obbligatorio';
    if (control.errors['email']) return 'Email non valida';
    if (control.errors['maxlength']) return 'Testo troppo lungo';
    return '';
  }

  initials(prof: ProfessionalResponse): string {
    return `${prof.firstName[0] ?? ''}${prof.lastName[0] ?? ''}`.toUpperCase();
  }
}
