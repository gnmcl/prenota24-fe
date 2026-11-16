# CLAUDE.md — Frontend

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Regole specifiche del frontend. Contratto API, auth, multi-tenancy e macchina a stati sono nel `CLAUDE.md` della radice del monorepo.

Stack: **Angular 21** (componenti standalone, builder `@angular/build`), TypeScript 5.9 strict (`strictTemplates`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`), **Tailwind CSS 4** via PostCSS, RxJS 7, font Public Sans.

## Comandi

```bash
npm start          # ng serve su :4200, proxy /api → http://localhost:8080
npm run build      # build di produzione (budget iniziale: warning 500kB, errore 1MB; stile per componente: 4kB/8kB)
npm test           # runner custom, vedi sotto
```

- **`npm test` non usa `ng test` né Vitest**, contrariamente a quanto dice il README. `tests/run-tests.mjs` compila ogni `tests/*.test.ts` con esbuild in `tmp/messaging-tests/` e lo esegue con `node:test` di Node. I test importano i sorgenti con estensione `.ts` e coprono solo logica pura (niente TestBed, niente DOM): la logica da testare va in funzioni pure, come in `features/messages/message-state.ts`.
- Un solo file: esegui `npm test` una volta, poi `node --test tmp/messaging-tests/<nome>.test.mjs`. Aggiungi `--test-name-pattern="..."` per un singolo caso.
- Formattazione con Prettier (`.prettierrc`). Non è configurato un linter.

## Struttura (`src/app`)

```
app.config.ts     provideRouter + provideHttpClient(withInterceptors([authInterceptor]))
app.routes.ts     tutte le route, lazy
core/guards       authGuard, roleGuard (funzionali)
core/interceptors auth.interceptor.ts (bearer, refresh su 401, normalizzazione errori)
core/models       domain.model.ts (tutti i tipi API), auth.model.ts
core/services     un service HTTP per risorsa + stato condiviso (auth, theme, navigation-layout, pending-appointments)
features/<nome>/  una cartella per pagina; features/pro/ = portale PROFESSIONAL
shared/components primitive UI riusabili
shared/utils      errors.ts (isApiError, getErrorMessage), appointment-status.ts (etichette e badge degli stati)
styles.css        token di design (light + dark), Tailwind
```

## Componenti

- Tutti i componenti sono standalone, con `standalone: true` esplicito. Nessun NgModule e nessun barrel `index.ts`. Selettori con prefisso `app-`.
- I template sono inline (`template:`) di default. I componenti grandi hanno `.html` separato (dashboard, agenda, messages, home…); fallo anche per un nuovo template oltre le ~150 righe. Alcuni file sono già molto grandi (`appointment-form`, `appointment-detail`, `agenda` oltre le 1000 righe): estrai sotto-componenti invece di farli crescere.
- DI con `inject()` nel corpo della classe (`private readonly`). Per i componenti nuovi usa `input()`/`output()`: alcuni shared, come `ButtonComponent`, usano ancora `@Input`.
- Stato del componente in `signal()`/`computed()`. Le chiamate HTTP restano `Observable` e il componente fa la `subscribe` in `ngOnInit`, mai nel costruttore. Per gli stream di lunga durata usa `takeUntilDestroyed`/`DestroyRef`. Niente `subscribe` annidate: usa `switchMap`/`forkJoin`.
- Template solo con control flow a blocchi (`@if`, `@for (...; track x.id)`, `@empty`). Nel codice non ci sono `*ngIf`/`*ngFor`.
- Form: template-driven (`FormsModule`, `ngModel`) per form semplici e filtri, `ReactiveFormsModule` per form complessi. Entrambi sono già in uso.
- Nessun `any` (oggi le occorrenze sono zero); usa `unknown` con type guard. `import type { ... }` per gli import solo di tipo.
- Ogni vista che carica dati gestisce caricamento, vuoto (`<app-empty-state>`) ed errore (`<app-alert>`).

## Servizi HTTP ed errori

- I componenti non iniettano mai `HttpClient`: passano dal service della risorsa (`@Injectable({ providedIn: 'root' })`), che restituisce `Observable<T>` tipizzati, costruisce gli URL con `environment.apiBaseUrl` e i parametri con `HttpParams`.
- Tre famiglie di service, da non mescolare:
  - admin (`appointment.service.ts`, `client.service.ts`, …), su `/api/{risorsa}`;
  - portale (`professional-portal.service.ts`), su `/api/portal/**`, usato solo da `features/pro/`;
  - pubblico (`public-booking.service.ts`, `public-event.service.ts`, `invitation.service.ts`).
- L'interceptor ha già trasformato l'errore in `ApiErrorResponse`, anche per errori di rete e per i retry dopo il refresh. Nei componenti usa `getErrorMessage(err)` da `shared/utils/errors.ts`, come già fanno la maggior parte delle pagine. Per reagire a un caso specifico usa `err.error`, il codice stabile del backend.
- Non leggere `localStorage` per l'auth: usa `AuthService` (`user()`, `isAuthenticated()`, `accessToken()`). Non chiamare il refresh a mano. Per il ruolo corrente: `authService.user()?.role`.

## Routing

- Ogni route usa `loadComponent: () => import(...)`, mai `component:`.
- Slug in italiano (`accedi`, `registrati`, `appuntamenti`, `clienti/:id/modifica`, `professionisti/nuovo`, `prenota/:studioSlug`, `invito/:token`). Il portale professionista sta sotto `pro/...`.
- Le route protette usano `canActivate: [authGuard, roleGuard]` con `data: { allowed: ['ADMIN'] }`, `['PROFESSIONAL']` o entrambi. `roleGuard` rimanda a `/pro/dashboard` o `/dashboard` in base al ruolo, `authGuard` a `/accedi`. `data.allowed` ha effetto solo insieme a `roleGuard`: non dichiararlo senza il guard.

## UI e design

- Il riferimento visivo è `DESIGN.md` (sistema "Registro di coordinamento": superfici piatte con hairline, niente ombre o gradienti decorativi, cobalto `--color-primary` solo per azione e stato attivo, verde registro raro, cifre `tabular-nums`). `PRODUCT.md` descrive utenti e contesto d'uso. Questi documenti prevalgono sulle regole visive di `AGENTS.md` §8, che sono più vecchie.
- Colori e superfici vengono dai token di `styles.css` (`--surface-*`, `--text-*`, `--button-*`, `--status-*`, `--color-primary*`), ridefiniti per il tema scuro. Il dark mode è class-based (`.dark` su `<html>`, gestito da `ThemeService`, con variant `dark:`). I token sono variabili CSS in `:root`, non nel `@theme` di Tailwind, quindi si usano con valori arbitrari: `text-[var(--text-primary)]`, `bg-[var(--surface-card)]`, `border-[var(--color-primary)]/20` (l'opacità funziona tramite `color-mix`). Un'utility come `text-primary` non esiste. L'accento è `--color-primary` (hover: `--color-primary-dark`), e la tinta tenue per selezioni e avatar è `--surface-active-nav`. Non usare colori Tailwind fissi (`indigo-*`, `violet-*`, …) né override `dark:` per i colori: i token cambiano già col tema. Le classi `gray-*` rimaste sono legacy da non estendere.
- Mobile-first: layout base per mobile, poi `sm:` (640px), `md:`, `lg:` (1024px). Su mobile la navigazione è in basso e le azioni principali sono a tutta larghezza.
- Usa le primitive di `shared/components` invece di stili ad hoc: `page-shell` (contenitore di ogni pagina autenticata), `register-surface` (superficie a registro per agenda e dashboard), `card`, `button` (variant `primary|secondary|ghost|danger|chat`, `isLoading`), `badge` (variant `green|red|amber|blue|gray|purple|indigo`), `alert`, `empty-state`, `confirm-dialog`, `input`, `textarea`, `entity-list`, `action-link`, `step-indicator`, `verification-code-input`, `public-header`. Una nuova primitiva va creata qui prima di usarla.
- Stato appuntamento: usa sempre `appointmentStatusLabel(status, compact?)` e `appointmentStatusVariant(status)` da `shared/utils/appointment-status.ts`, senza mappe locali. `compact = true` (etichetta "Proposta" invece di "Proposta orario") è per le superfici dense: dashboard, agenda, portale.
- Date: nei signal tieni le stringhe ISO, non oggetti `Date`. Formatta con locale `it-IT` e `timeZone` dello studio. Gli orari `LocalTime` vanno normalizzati con `.slice(0, 5)`.
