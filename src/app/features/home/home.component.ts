import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-white text-gray-900 antialiased">
      <!-- Navbar -->
      <nav class="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-lg">
        <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a routerLink="/" class="flex items-center gap-2">
            <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-black text-white shadow-lg shadow-indigo-200">P</span>
            <span class="text-lg font-bold tracking-tight text-gray-900">Prenota<span class="text-indigo-600">24</span></span>
          </a>
          <div class="flex items-center gap-2 sm:gap-3">
            <a routerLink="/accedi" class="rounded-lg px-3 sm:px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900">Accedi</a>
            <a routerLink="/registrati" class="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 sm:px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:shadow-lg hover:shadow-indigo-300 hover:-translate-y-0.5">Inizia gratis</a>
          </div>
        </div>
      </nav>

      <!-- Hero -->
      <section class="relative overflow-hidden">
        <div class="pointer-events-none absolute inset-0 -z-10">
          <div class="absolute -top-24 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-indigo-100/60 blur-3xl"></div>
          <div class="absolute -top-10 right-0 h-[400px] w-[400px] rounded-full bg-violet-100/50 blur-3xl"></div>
          <div class="absolute top-40 left-0 h-[300px] w-[300px] rounded-full bg-sky-100/40 blur-3xl"></div>
        </div>

        <div class="mx-auto max-w-6xl px-4 sm:px-6 pb-16 sm:pb-20 pt-16 sm:pt-28 lg:pt-36 text-center">
          <div class="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm">
            <span class="relative flex h-2 w-2">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-500 opacity-75"></span>
              <span class="relative inline-flex h-2 w-2 rounded-full bg-indigo-600"></span>
            </span>
            La gestione del tuo studio, semplificata
          </div>

          <h1 class="mx-auto max-w-3xl text-3xl sm:text-4xl lg:text-6xl font-extrabold leading-tight tracking-tight">
            Appuntamenti, team e clienti
            <span class="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">in un'unica piattaforma</span>
          </h1>

          <p class="mx-auto mt-6 max-w-2xl text-base sm:text-lg lg:text-xl leading-relaxed text-gray-500">
            Prenota24 è il gestionale completo per studi e professionisti. Organizza appuntamenti, gestisci il team, tieni traccia dei clienti e monitora tutto dalla tua dashboard.
          </p>

          <div class="mt-8 sm:mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a routerLink="/registrati" class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-7 sm:px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:shadow-indigo-300 hover:-translate-y-0.5">
              Crea il tuo studio
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </a>
            <a routerLink="/accedi" class="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-7 sm:px-8 py-3.5 text-base font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5">Accedi</a>
          </div>

          <!-- Hero visual: dashboard mockup -->
          <div class="relative mx-auto mt-12 sm:mt-16 max-w-4xl">
            <div class="rounded-2xl border border-gray-200/60 bg-gradient-to-b from-gray-50 to-white p-1.5 sm:p-2 shadow-2xl shadow-gray-200/50">
              <div class="rounded-xl bg-white overflow-hidden">
                <div class="flex items-center gap-2 border-b border-gray-100 px-3 sm:px-4 py-2.5 sm:py-3">
                  <span class="h-3 w-3 rounded-full bg-red-400"></span>
                  <span class="h-3 w-3 rounded-full bg-amber-400"></span>
                  <span class="h-3 w-3 rounded-full bg-green-400"></span>
                  <div class="ml-3 flex-1 rounded-md bg-gray-100 px-3 py-1 text-xs text-gray-400">prenota24.com/dashboard</div>
                </div>
                <!-- Simulated Dashboard -->
                <div class="p-4 sm:p-6">
                  <!-- Stats row -->
                  <div class="grid grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
                    @for (stat of dashStats; track stat.label) {
                      <div class="rounded-xl border border-gray-100 bg-gray-50 p-2.5 sm:p-4 text-center">
                        <div class="text-lg sm:text-2xl font-bold" [style.color]="stat.color">{{ stat.value }}</div>
                        <div class="text-[9px] sm:text-xs text-gray-400 mt-0.5">{{ stat.label }}</div>
                      </div>
                    }
                  </div>
                  <!-- Simulated agenda -->
                  <div class="flex gap-3 sm:gap-4">
                    <div class="flex-1 rounded-xl border border-gray-100 p-3 sm:p-4">
                      <div class="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 sm:mb-3">Appuntamenti oggi</div>
                      @for (apt of mockApts; track apt.name) {
                        <div class="flex items-center gap-2 sm:gap-3 py-1.5 sm:py-2 border-b border-gray-50 last:border-0">
                          <div class="rounded-lg bg-indigo-50 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold text-indigo-700">{{ apt.time }}</div>
                          <div>
                            <div class="text-xs sm:text-sm font-medium text-gray-900">{{ apt.name }}</div>
                            <div class="text-[9px] sm:text-xs text-gray-400">{{ apt.service }}</div>
                          </div>
                          <span class="ml-auto inline-block rounded-full px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[10px] font-medium"
                            [style.background-color]="apt.badgeBg"
                            [style.color]="apt.badgeColor">{{ apt.badge }}</span>
                        </div>
                      }
                    </div>
                    <div class="w-[120px] sm:w-[180px] rounded-xl border border-gray-100 p-3 sm:p-4 hidden sm:block">
                      <div class="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Calendario</div>
                      <div class="grid grid-cols-7 gap-0.5 text-center text-[8px] sm:text-[10px] font-medium text-gray-400 mb-1">
                        @for (d of weekdays; track d) { <span>{{ d }}</span> }
                      </div>
                      <div class="grid grid-cols-7 gap-0.5 text-center text-[9px] sm:text-xs">
                        @for (d of calendarDays; track d) {
                          <span [class]="getCalendarDayClass(d)" class="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-md transition-colors">{{ d }}</span>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="pointer-events-none absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-r from-indigo-200/30 via-violet-200/30 to-purple-200/30 blur-2xl"></div>
          </div>
        </div>
      </section>

      <!-- Value proposition strip -->
      <section class="pb-16 sm:pb-20">
        <div class="mx-auto max-w-6xl px-4 sm:px-6">
          <div class="rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm">
            <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div class="max-w-2xl">
                <p class="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Perche scegliere Prenota24</p>
                <h2 class="mt-2 text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
                  Semplice da usare, potente da gestire.
                </h2>
                <p class="mt-3 text-sm leading-relaxed text-gray-500 sm:text-base">
                  Dalla modalita agenda alla creazione eventi, Prenota24 ti aiuta a trasformare la gestione quotidiana
                  in un flusso rapido, chiaro e mobile-first.
                </p>
              </div>
              <div class="flex flex-wrap gap-3">
                <a routerLink="/registrati" class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                  Inizia ora
                </a>
                <a routerLink="/accedi" class="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50">
                  Vedi la piattaforma
                </a>
              </div>
            </div>

            <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div class="rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
                <p class="text-sm font-semibold text-indigo-900">Modalita Agenda</p>
                <p class="mt-1 text-xs text-indigo-700/80">Controlla la giornata per professionista e ottimizza gli slot in tempo reale.</p>
              </div>
              <div class="rounded-xl border border-violet-100 bg-violet-50/70 p-4">
                <p class="text-sm font-semibold text-violet-900">Eventi in autonomia</p>
                <p class="mt-1 text-xs text-violet-700/80">Crea, pubblica e monitora eventi con pagina prenotazione dedicata.</p>
              </div>
              <div class="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
                <p class="text-sm font-semibold text-emerald-900">UX immediata</p>
                <p class="mt-1 text-xs text-emerald-700/80">Interfaccia chiara e intuitiva per lavorare bene dal primo accesso.</p>
              </div>
              <div class="rounded-xl border border-sky-100 bg-sky-50/70 p-4">
                <p class="text-sm font-semibold text-sky-900">100% mobile compatibile</p>
                <p class="mt-1 text-xs text-sky-700/80">Tutte le funzionalita principali funzionano in modo fluido su smartphone.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- How it works -->
      <section class="bg-gray-50 py-16 sm:py-20 lg:py-28">
        <div class="mx-auto max-w-6xl px-4 sm:px-6">
          <div class="text-center">
            <p class="text-sm font-semibold uppercase tracking-widest text-indigo-600">Come funziona</p>
            <h2 class="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">4 passi, zero stress</h2>
            <p class="mx-auto mt-4 max-w-lg text-gray-500">Dalla registrazione alla prima prenotazione in pochi minuti.</p>
          </div>
          <div class="relative mt-12 sm:mt-16 grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div class="pointer-events-none absolute top-10 left-[12.5%] hidden h-0.5 w-[75%] bg-gradient-to-r from-indigo-200 via-violet-200 to-purple-200 lg:block"></div>
            @for (step of steps; track step.number) {
              <div class="group relative flex flex-col items-center text-center">
                <div class="relative mb-4 sm:mb-5 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-lg shadow-indigo-100 ring-1 ring-gray-100 transition-all group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-indigo-200">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" [attr.d]="step.iconPath" /></svg>
                  <span class="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-[10px] font-bold text-white shadow-sm">{{ step.number }}</span>
                </div>
                <h3 class="text-base sm:text-lg font-bold">{{ step.title }}</h3>
                <p class="mt-2 text-sm leading-relaxed text-gray-500">{{ step.description }}</p>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Features -->
      <section class="py-16 sm:py-20 lg:py-28">
        <div class="mx-auto max-w-6xl px-4 sm:px-6">
          <div class="text-center">
            <p class="text-sm font-semibold uppercase tracking-widest text-indigo-600">Funzionalità</p>
            <h2 class="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">Tutto ciò di cui hai bisogno</h2>
            <p class="mx-auto mt-4 max-w-lg text-gray-500">Un gestionale completo progettato per professionisti.</p>
          </div>
          <div class="mt-12 sm:mt-16 grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
            @for (feature of features; track feature.title) {
              <div class="group rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm transition-all hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-50 hover:-translate-y-1">
                <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" [attr.d]="feature.iconPath" /></svg>
                </div>
                <h3 class="text-base sm:text-lg font-bold">{{ feature.title }}</h3>
                <p class="mt-2 text-sm leading-relaxed text-gray-500">{{ feature.description }}</p>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="py-16 sm:py-20 lg:py-28">
        <div class="mx-auto max-w-6xl px-4 sm:px-6">
          <div class="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-6 sm:px-8 lg:px-16 py-12 sm:py-16 lg:py-20 text-center text-white shadow-2xl shadow-indigo-200">
            <div class="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-2xl"></div>
            <div class="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-white/10 blur-2xl"></div>
            <h2 class="relative text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight">Pronto a semplificare la gestione del tuo studio?</h2>
            <p class="relative mx-auto mt-4 max-w-md text-base text-indigo-100 sm:text-lg">Unisciti a chi ha già scelto Prenota24. Inizia a gestire appuntamenti, team e clienti in modo semplice.</p>
            <div class="relative mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a routerLink="/registrati" class="inline-flex items-center gap-2 rounded-xl bg-white px-7 sm:px-8 py-3.5 text-base font-semibold text-indigo-700 shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5">
                Inizia gratis
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </a>
              <a routerLink="/accedi" class="inline-flex items-center gap-2 rounded-xl border border-white/30 px-7 sm:px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-white/10 hover:-translate-y-0.5">Ho già un account</a>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="border-t border-gray-100 bg-gray-50 py-8 sm:py-10">
        <div class="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 sm:px-6 sm:flex-row sm:justify-between">
          <div class="flex items-center gap-2">
            <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-[10px] font-black text-white">P</span>
            <span class="text-sm font-semibold text-gray-500">Prenota<span class="text-indigo-600">24</span></span>
          </div>
          <p class="text-xs text-gray-400">&copy; {{ currentYear }} Prenota24 — Tutti i diritti riservati.</p>
        </div>
      </footer>
    </div>
  `,
})
export class HomeComponent {
  currentYear = new Date().getFullYear();
  weekdays = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
  calendarDays = Array.from({ length: 30 }, (_, i) => i + 1);

  dashStats = [
    { value: '8', label: 'Oggi', color: '#4F46E5' },
    { value: '3', label: 'Da confermare', color: '#D97706' },
    { value: '127', label: 'Clienti', color: '#059669' },
    { value: '4', label: 'Team', color: '#7C3AED' },
  ];

  mockApts = [
    { time: '09:00', name: 'Marco Bianchi', service: 'Consulenza 30min', badge: 'Confermato', badgeBg: '#D1FAE5', badgeColor: '#065F46' },
    { time: '10:30', name: 'Laura Verdi', service: 'Visita controllo', badge: 'Da confermare', badgeBg: '#FEF3C7', badgeColor: '#92400E' },
    { time: '14:00', name: 'Andrea Rossi', service: 'Trattamento completo', badge: 'Confermato', badgeBg: '#D1FAE5', badgeColor: '#065F46' },
    { time: '16:00', name: 'Sofia Neri', service: 'Prima visita', badge: 'Confermato', badgeBg: '#D1FAE5', badgeColor: '#065F46' },
  ];

  steps = [
    { number: '01', title: 'Registrati', description: 'Crea il tuo account in pochi secondi. Nessuna carta di credito richiesta.', iconPath: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75' },
    { number: '02', title: 'Configura il team', description: 'Aggiungi i professionisti del tuo studio, imposta le disponibilità e gli orari di lavoro.', iconPath: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { number: '03', title: 'Crea i servizi', description: 'Definisci i servizi che offri con durata, prezzo e colore per organizzare al meglio.', iconPath: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
    { number: '04', title: 'Ricevi appuntamenti', description: 'Gestisci tutti gli appuntamenti dall\'agenda visuale. Semplice, organizzato, automatico.', iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  ];

  features = [
    { title: 'Agenda visuale', description: 'Calendario giornaliero per professionista con vista ad ore, appuntamenti colorati per servizio e click per prenotare.', iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { title: 'Gestione team', description: 'Aggiungi professionisti, configura disponibilità settimanali, gestisci eccezioni e invita al portale dedicato.', iconPath: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { title: 'Clienti CRM', description: 'Anagrafica clienti con note, storico appuntamenti, ricerca rapida e creazione al volo durante la prenotazione.', iconPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { title: 'Servizi configurabili', description: 'Definisci i servizi con durata, prezzo e colore. Associa i professionisti abilitati per ogni servizio.', iconPath: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
    { title: 'Mobile-first', description: 'Interfaccia perfettamente ottimizzata per smartphone con bottom navigation, touch target e layout responsive.', iconPath: 'M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3' },
    { title: 'Eventi e landing', description: 'Crea eventi con pagine di prenotazione pubbliche. Condividi il link e raccogli registrazioni automaticamente.', iconPath: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  ];

  getCalendarDayClass(d: number): string {
    if (d === 7) return 'bg-indigo-600 font-bold text-white shadow-sm';
    if (d > 5 && d < 15) return 'text-gray-700 hover:bg-indigo-50 cursor-pointer';
    return 'text-gray-300';
  }
}
