---
description: "Use when creating Angular components, features, services, or routes. Covers standalone components, signal patterns, shared component library, HTTP service structure, routing with guards, domain model interface conventions, and file naming for Prenota24 frontend."
applyTo: "frontend/src/**/*.ts"
---
# Angular Feature Development — Prenota24 Frontend

> For monorepo-level rules see `/AGENTS.md`. For backend counterparts see `backend/AGENTS.md`.

---

## 1. Feature Folder Layout

Every routed page lives in `features/{feature-name}/`:

```
features/appointments/
├── appointments.component.ts       List/overview page
├── appointment-detail.component.ts Detail/edit page
└── appointment-form.component.ts   Create/edit form (when form is large)
```

- One component per file. No `index.ts` barrels.
- Components are **always standalone** — no NgModules ever.

---

## 2. Component Skeleton (Canonical Order)

```typescript
// ① Angular core imports
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// ② Shared components (import only what's used)
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';

// ③ Domain types (use `import type` for tree-shaking)
import type { AppointmentResponse, ApiErrorResponse } from '../../core/models/domain.model';

// ④ Feature-specific service
import { AppointmentService } from '../../core/services/appointment.service';

@Component({
  selector: 'app-appointments',   // always app- prefix, kebab-case
  standalone: true,
  imports: [RouterLink, PageShellComponent, CardComponent, ButtonComponent, BadgeComponent, EmptyStateComponent, AlertComponent],
  template: `...`
})
export class AppointmentsComponent implements OnInit {

  // ⑤ Services via inject() — always private readonly
  private readonly aptService = inject(AppointmentService);
  private readonly router = inject(Router);

  // ⑥ State signals — always readonly
  readonly appointments = signal<AppointmentResponse[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);

  // ⑦ Derived state via computed()
  readonly confirmedCount = computed(() =>
    this.appointments().filter(a => a.status === 'CONFIRMED').length
  );

  // ⑧ Simple form fields (not signals — plain TS properties)
  searchQuery = '';

  ngOnInit(): void {
    this.aptService.list().subscribe({
      next: (page) => {
        this.appointments.set(page.content);
        this.isLoading.set(false);
      },
      error: (err: ApiErrorResponse) => {
        this.error.set(err.message ?? 'Si è verificato un errore');
        this.isLoading.set(false);
      },
    });
  }
}
```

**Rules:**
- Never set `changeDetection` explicitly (defaults to `Default`, which is fine).
- No `styleUrls` or `styles` — use Tailwind CSS classes inline in the template.
- Use separate `.html` template file **only** when template exceeds ~150 lines.

---

## 3. Signals vs RxJS

| Concern | Use |
|---|---|
| Component state (loading, data, error, filter) | `signal<T>()` |
| Derived/computed state | `computed(() => ...)` |
| HTTP calls | `Observable<T>` (services always return Observables) |
| Multi-step async flows | `switchMap`, `forkJoin`, `combineLatest` |

**Never** use `toSignal()` or `toObservable()`. Keep the two worlds separate.

Subscribe to Observables in `ngOnInit`, never in constructors.

---

## 4. Standard Loading/Error Template Pattern

Every list and detail component must use this three-state layout:

```html
<app-page-shell>
  <app-card>
    @if (isLoading()) {
      <div class="flex justify-center py-12">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    } @else if (error()) {
      <app-alert variant="error" [message]="error()!" />
    } @else {
      @for (item of items(); track item.id) {
        <!-- item row -->
      } @empty {
        <app-empty-state icon="📋" title="Nessun elemento" />
      }
    }
  </app-card>
</app-page-shell>
```

Always set `isLoading.set(false)` in **both** `next` and `error` handlers.

---

## 5. Shared Component Library

**Always use these shared components. Never inline ad-hoc equivalents.**

| Selector | Purpose | Key Props |
|---|---|---|
| `<app-page-shell>` | Page wrapper (sidebar/nav layout) | *(none — wraps content)* |
| `<app-card>` | Content container | `extraClass` (e.g. `"!p-0"`) |
| `<app-button>` | All buttons | `variant` (`primary`/`secondary`/`danger`), `isLoading`, `disabled`, `type` |
| `<app-badge>` | Status/label badge | `variant`: `green`, `red`, `amber`, `blue`, `gray`, `purple` |
| `<app-alert>` | Inline error/info message | `variant` (`error`/`warning`/`info`/`success`), `message` |
| `<app-empty-state>` | Empty list placeholder | `icon`, `title`, `description`, `actionLabel`, `actionRoute` |
| `<app-input>` | Styled form input | `label`, `formControlName`, `error`, `type`, `placeholder` |
| `<app-confirm-dialog>` | Confirmation modal | Template-driven, trigger programmatically |
| `<app-step-indicator>` | Multi-step form progress | `steps`, `currentStep` |

---

## 6. HTTP Service Pattern

One service per backend resource, located in `core/services/`:

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { AppointmentResponse, CreateAppointmentRequest, Page } from '../models/domain.model';

const BASE = '/api/appointments';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly http = inject(HttpClient);

  // GET collection with optional query params
  list(page = 0, size = 20, status?: string): Observable<Page<AppointmentResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) params = params.set('status', status);
    return this.http.get<Page<AppointmentResponse>>(BASE, { params });
  }

  // GET single
  getById(id: string): Observable<AppointmentResponse> {
    return this.http.get<AppointmentResponse>(`${BASE}/${id}`);
  }

  // POST create (returns 201)
  create(payload: CreateAppointmentRequest): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(BASE, payload);
  }

  // PUT full replace (returns 200)
  update(id: string, payload: UpdateAppointmentRequest): Observable<AppointmentResponse> {
    return this.http.put<AppointmentResponse>(`${BASE}/${id}`, payload);
  }

  // DELETE (returns 204 — no body)
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${BASE}/${id}`);
  }

  // State-transition action (POST to /{id}/{action})
  confirm(id: string): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(`${BASE}/${id}/confirm`, {});
  }
}
```

**Rules:**
- Services **never** catch or transform errors — let components handle them.
- `providedIn: 'root'` always.
- `private readonly http = inject(HttpClient)` — use `inject()`, not constructor params.

---

## 7. Domain Model Conventions (`core/models/domain.model.ts`)

All shared TypeScript interfaces live in a **single file**: `domain.model.ts`.

```typescript
// ① Branded type for UUID fields
export type UUID = string & { readonly __brand: 'UUID' };

// ② Status enum as const union (not TypeScript enum)
export const APPOINTMENT_STATUSES = ['REQUESTED', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

// ③ Response interface — mirrors backend DTO record
export interface AppointmentResponse {
  id: UUID;
  startDatetime: string;    // ISO-8601 UTC "2026-05-15T09:00:00Z"
  status: AppointmentStatus;
  durationMinutes: number;
  notes?: string;           // optional with ?
}

// ④ Request interfaces
export interface CreateAppointmentRequest {
  professionalId: string;
  startDatetime: string;    // ISO-8601 UTC
  notes?: string;
}
```

**Field type rules:**
| Backend type | TypeScript type | Notes |
|---|---|---|
| `UUID` | `string` | Never use a UUID class |
| `Instant` | `string` | ISO-8601 UTC: `"2026-05-15T09:00:00Z"` |
| `LocalDate` | `string` | Format: `"YYYY-MM-DD"` |
| `LocalTime` | `string` | Format: `"HH:mm"` |
| Optional field | `field?: type` | Use `?` not `field: type \| null` |
| Nullable field | `field: type \| null` | Only when API explicitly returns `null` |

**No `any`.** Use proper typed interfaces always.

**DTO Parity Rule:** Every field in a Java DTO must have a matching field in the TypeScript interface, and vice versa. Always verify both sides when changing either.

---

## 8. Routing Pattern

Add routes to `app.routes.ts` — all lazy-loaded:

```typescript
// Public (no guard)
{
  path: 'accedi',
  loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent),
},

// Admin-only
{
  path: 'appuntamenti',
  loadComponent: () => import('./features/appointments/appointments.component').then(m => m.AppointmentsComponent),
  canActivate: [authGuard, roleGuard],
  data: { allowed: ['ADMIN'] },
},

// Both roles
{
  path: 'impostazioni',
  loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
  canActivate: [authGuard, roleGuard],
  data: { allowed: ['ADMIN', 'PROFESSIONAL'] },
},

// With route param
{
  path: 'appuntamenti/:id',
  loadComponent: () => import('./features/appointments/appointment-detail.component').then(m => m.AppointmentDetailComponent),
  canActivate: [authGuard, roleGuard],
  data: { allowed: ['ADMIN'] },
},
```

**Route path naming:** Italian slugs (`/appuntamenti`, `/clienti`, `/professionisti`). Match existing patterns.

---

## 9. Naming Conventions

| Item | Pattern | Example |
|---|---|---|
| Component file | `{feature-name}.component.ts` | `appointments.component.ts` |
| Detail component | `{entity}-detail.component.ts` | `client-detail.component.ts` |
| Form component | `{entity}-form.component.ts` | `client-form.component.ts` |
| Component class | `{FeatureName}Component` | `AppointmentsComponent` |
| Service file | `{domain}.service.ts` | `appointment.service.ts` |
| Service class | `{Domain}Service` | `AppointmentService` |
| Response interface | `{Domain}Response` | `AppointmentResponse` |
| Create request | `Create{Domain}Request` | `CreateAppointmentRequest` |
| Update request | `Update{Domain}Request` | `UpdateAppointmentRequest` |
| Status type | `{Domain}Status` | `AppointmentStatus` |
| Status const | `{DOMAIN}_STATUSES` | `APPOINTMENT_STATUSES` |
| Boolean signal | `is{State}` | `isLoading`, `isSaving` |
| Data signal | `{pluralNoun}` | `appointments`, `clients` |

---

## 10. Forms

**Simple edits → template-driven (plain properties + `[(ngModel)]`):**
```typescript
editNotes = '';

onSave(): void {
  if (!this.editNotes.trim()) return;
  this.service.update(this.id, { notes: this.editNotes }).subscribe({
    next: () => this.editMode.set(false),
    error: (err: ApiErrorResponse) => this.error.set(err.message),
  });
}
```

**Complex forms with validation → Reactive Forms:**
```typescript
private readonly fb = inject(FormBuilder);
readonly form = this.fb.group({
  firstName: ['', [Validators.required, Validators.minLength(2)]],
  email: ['', [Validators.email]],
});

onSubmit(): void {
  if (this.form.invalid) return;
  this.isSaving.set(true);
  this.service.create(this.form.getRawValue()).subscribe({
    next: () => this.router.navigate(['/clienti']),
    error: (err: ApiErrorResponse) => {
      this.error.set(err.message);
      this.isSaving.set(false);
    },
  });
}
```

Use `<app-input>` for form fields. Never raw `<input>` elements without the shared component.

---

## 11. Datetime Handling

- **Display** ISO-8601 dates: `new Date(isoString).toLocaleDateString('it-IT', { ... })`
- **Send to API**: `new Date().toISOString()` → `"2026-05-15T09:00:00.000Z"`
- **Date picker** (`<input type="date">`): returns `"YYYY-MM-DD"` — send as-is for `LocalDate` fields
- **Time picker** (`<input type="time">`): returns `"HH:mm"` — send as-is for `LocalTime` fields
- **Combining date + time** for `Instant` fields: `\`${date}T${time}:00Z\``
- Never use a third-party date library for simple formatting; use native `Intl`/`Date` API.
