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
        <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <a routerLink="/" class="flex items-center gap-2">
            <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-black text-white shadow-md shadow-indigo-200">P</span>
            <span class="text-lg font-bold tracking-tight text-gray-900">Prenota<span class="text-indigo-600">24</span></span>
          </a>
          <div class="flex items-center gap-3">
            <a routerLink="/accedi" class="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900">Accedi</a>
            <a routerLink="/registrati" class="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:shadow-lg hover:shadow-indigo-300 hover:-translate-y-0.5">Inizia gratis</a>
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

        <div class="mx-auto max-w-6xl px-6 pb-20 pt-20 text-center sm:pt-28 lg:pt-36">
          <div class="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm">
            <span class="relative flex h-2 w-2">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-500 opacity-75"></span>
              <span class="relative inline-flex h-2 w-2 rounded-full bg-indigo-600"></span>
            </span>
            Crea prenotazioni in meno di 60 secondi
          </div>

          <h1 class="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Gestisci le tue prenotazioni
            <span class="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">in modo semplice</span>
          </h1>

          <p class="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-500 sm:text-xl">
            Prenota24 ti permette di creare landing page di prenotazione bellissime e funzionali, condividerle con i tuoi clienti e gestire tutto da un'unica dashboard.
          </p>

          <div class="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a routerLink="/registrati" class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:shadow-indigo-300 hover:-translate-y-0.5">
              Crea il tuo account
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </a>
            <a routerLink="/accedi" class="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5">Accedi</a>
          </div>

          <!-- Hero visual -->
          <div class="relative mx-auto mt-16 max-w-4xl">
            <div class="rounded-2xl border border-gray-200/60 bg-gradient-to-b from-gray-50 to-white p-2 shadow-2xl shadow-gray-200/50">
              <div class="rounded-xl bg-white">
                <div class="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
                  <span class="h-3 w-3 rounded-full bg-red-400"></span>
                  <span class="h-3 w-3 rounded-full bg-amber-400"></span>
                  <span class="h-3 w-3 rounded-full bg-green-400"></span>
                  <div class="ml-3 flex-1 rounded-md bg-gray-100 px-3 py-1 text-xs text-gray-400">prenota24.app/il-tuo-evento</div>
                </div>
                <div class="p-6 sm:p-10">
                  <div class="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-10">
                    <div class="flex-1 text-left">
                      <div class="mb-3 inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">🎉 Evento disponibile</div>
                      <h3 class="text-xl font-bold text-gray-900 sm:text-2xl">Consulenza Gratuita</h3>
                      <p class="mt-2 text-sm text-gray-500">Prenota la tua sessione di 30 minuti. Scegli il giorno e l'orario che preferisci.</p>
                      <div class="mt-4 flex items-center gap-4 text-sm text-gray-400">
                        <span class="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          30 min
                        </span>
                        <span class="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                          Online
                        </span>
                      </div>
                    </div>
                    <div class="w-full max-w-[220px] rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <div class="mb-3 text-center text-xs font-semibold text-gray-700">Aprile 2026</div>
                      <div class="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-gray-400">
                        @for (d of weekdays; track d) { <span>{{ d }}</span> }
                      </div>
                      <div class="mt-1 grid grid-cols-7 gap-1 text-center text-xs">
                        @for (d of calendarDays; track d) {
                          <span [class]="getCalendarDayClass(d)" class="flex h-6 w-6 items-center justify-center rounded-md transition-colors">{{ d }}</span>
                        }
                      </div>
                    </div>
                  </div>
                  <div class="mt-6">
                    <button class="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:shadow-lg">Prenota ora</button>
                  </div>
                </div>
              </div>
            </div>
            <div class="pointer-events-none absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-r from-indigo-200/30 via-violet-200/30 to-purple-200/30 blur-2xl"></div>
          </div>
        </div>
      </section>

      <!-- How it works -->
      <section class="bg-gray-50 py-20 sm:py-28">
        <div class="mx-auto max-w-6xl px-6">
          <div class="text-center">
            <p class="text-sm font-semibold uppercase tracking-widest text-indigo-600">Come funziona</p>
            <h2 class="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">4 passi, zero stress</h2>
            <p class="mx-auto mt-4 max-w-lg text-gray-500">Dalla registrazione alla prima prenotazione in meno di 5 minuti.</p>
          </div>
          <div class="relative mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div class="pointer-events-none absolute top-10 left-[12.5%] hidden h-0.5 w-[75%] bg-gradient-to-r from-indigo-200 via-violet-200 to-purple-200 lg:block"></div>
            @for (step of steps; track step.number) {
              <div class="group relative flex flex-col items-center text-center">
                <div class="relative mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-lg shadow-indigo-100 ring-1 ring-gray-100 transition-all group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-indigo-200">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" [attr.d]="step.iconPath" /></svg>
                  <span class="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-[10px] font-bold text-white shadow-sm">{{ step.number }}</span>
                </div>
                <h3 class="text-lg font-bold">{{ step.title }}</h3>
                <p class="mt-2 text-sm leading-relaxed text-gray-500">{{ step.description }}</p>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Features -->
      <section class="py-20 sm:py-28">
        <div class="mx-auto max-w-6xl px-6">
          <div class="text-center">
            <p class="text-sm font-semibold uppercase tracking-widest text-indigo-600">Funzionalità</p>
            <h2 class="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Tutto ciò di cui hai bisogno</h2>
            <p class="mx-auto mt-4 max-w-lg text-gray-500">Prenota24 è pensato per chi vuole risultati, senza complicazioni.</p>
          </div>
          <div class="mt-16 grid gap-8 sm:grid-cols-2">
            @for (feature of features; track feature.title) {
              <div class="group rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-50 hover:-translate-y-1">
                <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" [attr.d]="feature.iconPath" /></svg>
                </div>
                <h3 class="text-lg font-bold">{{ feature.title }}</h3>
                <p class="mt-2 text-sm leading-relaxed text-gray-500">{{ feature.description }}</p>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="py-20 sm:py-28">
        <div class="mx-auto max-w-6xl px-6">
          <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-8 py-16 text-center text-white shadow-2xl shadow-indigo-200 sm:px-16 sm:py-20">
            <div class="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-2xl"></div>
            <div class="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-white/10 blur-2xl"></div>
            <h2 class="relative text-3xl font-extrabold leading-tight sm:text-4xl">Pronto a semplificare le tue prenotazioni?</h2>
            <p class="relative mx-auto mt-4 max-w-md text-base text-indigo-100 sm:text-lg">Unisciti a chi ha già scelto Prenota24. Crea il tuo primo evento in meno di un minuto.</p>
            <div class="relative mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a routerLink="/registrati" class="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-indigo-700 shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5">
                Inizia gratis
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </a>
              <a routerLink="/accedi" class="inline-flex items-center gap-2 rounded-xl border border-white/30 px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-white/10 hover:-translate-y-0.5">Ho già un account</a>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="border-t border-gray-100 bg-gray-50 py-10">
        <div class="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 sm:flex-row sm:justify-between">
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

  steps = [
    { number: '01', title: 'Registrati', description: 'Crea il tuo account in pochi secondi con email e password. Nessuna carta di credito richiesta.', iconPath: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75' },
    { number: '02', title: 'Crea il tuo evento', description: 'Configura date, orari, numero di posti e dettagli. Il tuo evento è pronto in meno di un minuto.', iconPath: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5' },
    { number: '03', title: 'Condividi il link', description: 'Invia il link della tua landing page via WhatsApp, social o email ai tuoi clienti.', iconPath: 'M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z' },
    { number: '04', title: 'Ricevi prenotazioni', description: 'Gestisci tutte le prenotazioni dalla tua dashboard. Semplice, organizzato, automatico.', iconPath: 'M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z' },
  ];

  features = [
    { title: 'Veloce e intuitivo', description: 'Nessuna competenza tecnica richiesta. Crea la tua pagina di prenotazione in pochi click.', iconPath: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z' },
    { title: 'Mobile-first', description: 'Le tue landing page sono perfettamente ottimizzate per smartphone, tablet e desktop.', iconPath: 'M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3' },
    { title: 'Sicuro e affidabile', description: 'I dati dei tuoi clienti sono protetti. Infrastruttura moderna e sempre disponibile.', iconPath: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z' },
    { title: 'Dashboard completa', description: 'Monitora prenotazioni, disponibilità e statistiche da un unico pannello di controllo.', iconPath: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z' },
  ];

  getCalendarDayClass(d: number): string {
    if (d === 7) return 'bg-indigo-600 font-bold text-white shadow-sm';
    if (d > 5 && d < 15) return 'text-gray-700 hover:bg-indigo-50 cursor-pointer';
    return 'text-gray-300';
  }
}
