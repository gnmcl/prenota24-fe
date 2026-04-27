# AGENTS.md — Frontend (Angular)

> Read `/AGENTS.md` first for monorepo-level rules. This file adds frontend-specific constraints.

---

## 1. Project Structure

```
src/app/
├── app.config.ts           Angular app config (providers, interceptors, router)
├── app.routes.ts           All routes — lazy-loaded standalone components
├── app.ts                  Root component
├── core/
│   ├── guards/             authGuard, roleGuard
│   ├── interceptors/       auth.interceptor.ts (JWT + refresh logic)
│   ├── models/             domain.model.ts — ALL shared TypeScript interfaces
│   └── services/           HTTP services — one per backend resource
├── environments/           environment.ts (apiBaseUrl etc.)
├── features/               One folder per page/feature (see §2)
└── shared/
    ├── components/         Reusable UI components (see §3)
    └── utils/              Pure helper functions
```

---

## 2. Feature Folder Convention

Each routed page lives in `features/{feature-name}/`:
```
features/appointments/
├── appointments.component.ts       List page
├── appointment-detail.component.ts Detail page
└── appointment-form.component.ts   Create/edit form
```

- One component per file. No barrel `index.ts` files.
- Components are Angular **standalone** — no NgModules.
- Templates are **inline** (`template: \`...\``) for single-file components. Use separate `.html` only for templates exceeding ~150 lines.
- Feature components import only what they need (`imports: [RouterLink, FormsModule, ...]`)

---

## 3. Shared Component Library

Use only these shared components for UI primitives. Never inline-style ad-hoc equivalents.

| Component | Selector | Purpose |
|---|---|---|
| PageShellComponent | `<app-page-shell>` | Page wrapper with sidebar/nav |
| CardComponent | `<app-card>` | Content container. `extraClass` input for margin overrides |
| ButtonComponent | `<app-button>` | All buttons. Props: `variant`, `isLoading`, `disabled` |
| BadgeComponent | `<app-badge>` | Status/label badges. `variant`: `green`, `red`, `amber`, `blue`, `gray`, `purple` |
| ConfirmDialogComponent | `<app-confirm-dialog>` | Confirmation modal |
| EmptyStateComponent | `<app-empty-state>` | Empty list placeholder |
| InputComponent | `<app-input>` | Styled form input |
| AlertComponent | `<app-alert>` | Inline error/info messages |
| StepIndicatorComponent | `<app-step-indicator>` | Multi-step form progress |

**Adding a new primitive:** create it in `shared/components/` before using it. Do not duplicate.

---

## 4. TypeScript Rules

### 4.1 Strict Mode — No Exceptions
```typescript
// ✅ Correct
const id: string = exc.id;
const slots: AvailabilityExceptionSlotResponse[] = exc.slots;

// ❌ Never
const data: any = response;
const items = [] as any[];
```

- `any` is banned. Use `unknown` + type guards if the shape is truly unknown.
- All function parameters and return types must be typed.
- Use `import type { ... }` for type-only imports.

### 4.2 Domain Types — Central Source of Truth
**All shared API types live in `src/app/core/models/domain.model.ts`.**

Pattern for response types:
```typescript
export interface AppointmentResponse {
  id: string;           // UUID as string
  startDatetime: string; // Instant → ISO-8601 string
  status: AppointmentStatus;
}
```

Pattern for request types:
```typescript
export interface CreateAppointmentRequest {
  professionalId: string;
  startDatetime: string; // ISO-8601 UTC: "2026-05-15T09:00:00Z"
  notes?: string;        // optional fields with ?
}
```

- `UUID` fields: always `string` in TypeScript (no custom UUID type in templates)
- Enum-like union types: `export const X = [...] as const; export type X = typeof X[number]`
- Optional fields: `field?: type` (not `field: type | null` unless the API explicitly returns null)

### 4.3 Datetime Handling
- **Receive from API:** `string` (ISO-8601 UTC)
- **Display:** `new Date(isoString).toLocaleString('it-IT', { ... })` or similar
- **Send to API:** ISO-8601 UTC string: `new Date().toISOString()`
- **Date-only:** `"YYYY-MM-DD"` string — used in date pickers (`<input type="date">`)
- **Time-only:** `"HH:mm"` string — used in time pickers (`<input type="time">`)
- Never store raw `Date` objects in signals or component state — use strings

---

## 5. Angular Patterns

### 5.1 Signals (Preferred for Component State)
```typescript
export class AppointmentsComponent implements OnInit {
  readonly appointments = signal<AppointmentResponse[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);

  // Derived state via computed()
  readonly confirmedCount = computed(() =>
    this.appointments().filter(a => a.status === 'CONFIRMED').length
  );

  ngOnInit(): void {
    this.aptService.list().subscribe({
      next: (page) => {
        this.appointments.set(page.content);
        this.isLoading.set(false);
      },
      error: (err: ApiErrorResponse) => {
        this.error.set(err.message);
        this.isLoading.set(false);
      },
    });
  }
}
```

**Use signals for:**
- Component-local UI state (loading, error, selected item, open/close)
- Data fetched from the server
- Derived values via `computed()`

**Use RxJS (Observables) for:**
- HTTP calls (services return `Observable<T>`)
- Multi-step async flows
- Event streams

### 5.2 `inject()` for Dependency Injection
```typescript
export class MyComponent {
  private readonly aptService = inject(AppointmentService);
  private readonly router = inject(Router);
}
```

Use `inject()` in the component class body (not constructor params) for cleaner code. Both styles are acceptable — be consistent within a component.

### 5.3 Lifecycle
- Use `ngOnInit` for data loading, not the constructor.
- Prefer `inject()` + class property over constructor DI for service injection.
- Avoid `ngOnChanges` when signals solve the problem.

### 5.4 Template Control Flow
Use the modern Angular 17+ block syntax:
```html
@if (isLoading()) {
  <!-- loading state -->
} @else if (error()) {
  <!-- error state -->
} @else {
  @for (item of items(); track item.id) {
    <!-- item -->
  } @empty {
    <!-- empty state -->
  }
}
```
Never use `*ngIf`, `*ngFor`, `*ngSwitch` directives.

---

## 6. Services — HTTP Layer

### 6.1 Service Rules
```typescript
@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly http = inject(HttpClient);

  list(page = 0, size = 20): Observable<Page<AppointmentResponse>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<AppointmentResponse>>(`${BASE}/appointments`, { params });
  }

  getById(id: string): Observable<AppointmentResponse> {
    return this.http.get<AppointmentResponse>(`${BASE}/appointments/${id}`);
  }

  create(request: CreateAppointmentRequest): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(`${BASE}/appointments`, request);
  }
}
```

- One service per backend resource domain
- Services return `Observable<T>` — never subscribe inside a service
- Components subscribe and own the lifecycle
- Use `HttpParams` for query parameters — never string interpolation
- Type every HTTP call with the correct response type

### 6.2 Two-Role Services
The app has two service "families":
- **Admin services** (`professional.service.ts`, `appointment.service.ts`, etc.) → call `/api/{resource}`
- **Portal service** (`professional-portal.service.ts`) → calls `/api/portal/{resource}` (PROFESSIONAL role only)

Do not mix them. The professional portal calls go through `professional-portal.service.ts` only.

### 6.3 Error Handling
Errors from the interceptor arrive typed as `ApiErrorResponse`. Handle in components:
```typescript
this.service.create(payload).subscribe({
  next: (result) => { /* handle success */ },
  error: (err: ApiErrorResponse) => {
    this.error.set(err.message ?? 'Si è verificato un errore');
    this.isLoading.set(false);
  },
});
```

---

## 7. Routing

### 7.1 All Routes Are Lazy-Loaded
```typescript
{
  path: 'appointments/:id',
  loadComponent: () => import('./features/appointments/appointment-detail.component')
    .then(m => m.AppointmentDetailComponent),
  canActivate: [authGuard, roleGuard],
  data: { allowed: ['ADMIN'] },
}
```

- Never use `component:` (eager). Always `loadComponent:` with dynamic import.
- Route paths: Italian slugs matching the product language (`appuntamenti`, `professionisti`, `clienti`)
- Parameters: `:id` for UUIDs, `:slug` for human-readable slugs, `:token` for opaque tokens

### 7.2 Guards
- `authGuard`: redirects to `/accedi` if not authenticated
- `roleGuard`: reads `data.allowed` array, redirects if user's role is not included
- Both guards are functional (`CanActivateFn`)
- Shared routes (both ADMIN and PROFESSIONAL): `data: { allowed: ['ADMIN', 'PROFESSIONAL'] }`

### 7.3 Route Data Patterns
```typescript
// Admin only
data: { allowed: ['ADMIN'] }

// Professional only
data: { allowed: ['PROFESSIONAL'] }

// Both roles
data: { allowed: ['ADMIN', 'PROFESSIONAL'] }
```

---

## 8. UI / UX — Mobile-First (Mandatory)

### 8.1 Mobile-First Is Non-Negotiable
Every layout must be designed for mobile first, then enhanced for tablet/desktop using responsive utilities.

```html
<!-- Mobile: stack vertically. Desktop: side by side -->
<div class="flex flex-col sm:flex-row sm:items-center gap-3">
  ...
</div>

<!-- Mobile: full width. Desktop: auto width -->
<input class="w-full sm:w-auto ..." />

<!-- Mobile: hidden. Desktop: visible -->
<span class="hidden sm:inline">Desktop label</span>
```

### 8.2 Responsive Breakpoints (Tailwind-style in use)
| Prefix | Min-width | Use for |
|---|---|---|
| *(none)* | 0px | Mobile (default) |
| `sm:` | 640px | Tablet and up |
| `md:` | 768px | Larger tablet |
| `lg:` | 1024px | Desktop |

### 8.3 Mandatory States
Every data-driven view must have three states:

**Loading:**
```html
@if (isLoading()) {
  <div class="flex justify-center py-12">
    <div class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
  </div>
}
```

**Empty:**
```html
@if (items().length === 0) {
  <app-empty-state>Nessun elemento trovato</app-empty-state>
}
```

**Error:**
```html
@if (error()) {
  <app-alert variant="error">{{ error() }}</app-alert>
}
```

### 8.4 Visual Consistency Rules
- Use `<app-button>` — never raw `<button>` with ad-hoc styling for primary actions
- Use `<app-badge>` for all status labels with the established variant colors
- Use `<app-card>` for content containers — never custom `div` with card-like styles
- Use `<app-page-shell>` as the outermost wrapper on every page
- Spacing: `gap-3` between fields, `mb-6`/`mb-8` between sections, `p-4`/`p-6` inside cards
- Typography: `text-2xl font-bold text-gray-900` for page titles, `text-sm font-semibold uppercase tracking-wider text-gray-400` for section headers

### 8.5 Color Semantics
| Color | Badge variant | Use for |
|---|---|---|
| Green | `green` | Active, confirmed, success |
| Red | `red` | Cancelled, error, unavailable |
| Amber | `amber` | Pending, warning |
| Blue | `blue` | Info, proposed |
| Gray | `gray` | Inactive, completed, neutral |
| Purple | `purple` | No-show, special status |
| Indigo | *(primary)* | Primary actions, selected state, focus rings |

### 8.6 Forms
- Labels: always `<label>` elements, explicitly associated with their input
- Validation errors: inline, close to the field, using `text-xs text-red-500`
- Disabled submit while loading: `[disabled]="isLoading()"` on `<app-button>`
- Reset form state after successful submission

### 8.7 Appointment Status Display
Use consistent status display everywhere:
```typescript
statusLabel(status: AppointmentStatus): string {
  const map = { REQUESTED: 'Da confermare', CONFIRMED: 'Confermato',
    PROPOSED_NEW_TIME: 'Proposta', CANCELLED: 'Cancellato',
    COMPLETED: 'Completato', NO_SHOW: 'Non presentato' };
  return map[status] ?? status;
}

statusVariant(status: AppointmentStatus): BadgeVariant {
  const map = { REQUESTED: 'amber', CONFIRMED: 'green',
    PROPOSED_NEW_TIME: 'blue', CANCELLED: 'red',
    COMPLETED: 'gray', NO_SHOW: 'purple' };
  return map[status] ?? 'gray';
}
```

---

## 9. Forms — Reactive vs Template-Driven

### 9.1 When to Use Each
- **Template-driven (`FormsModule`, `ngModel`):** Simple forms with 1-4 fields, inline filters, quick toggles. Already used extensively in this project for availability and exception forms.
- **Reactive (`ReactiveFormsModule`):** Complex forms with cross-field validation, dynamic arrays, multi-step flows.

### 9.2 Template-Driven Form Pattern (existing style)
```typescript
// Component state
newExcDate = '';
newExcReason = '';
slotError = '';

// In template
<input type="date" [(ngModel)]="newExcDate" />
<input type="text" [(ngModel)]="newExcReason" />

// Submit guard
addException(): void {
  if (!this.newExcDate) return;
  // validate, then call service
}
```

### 9.3 Validation Messages
- Place errors directly below the relevant input
- Use `text-xs text-red-500 mt-1` styling
- Validate on submit (not on every keystroke) for better UX in simple forms

---

## 10. Auth Service Integration

```typescript
// In any component that needs auth context:
private readonly authService = inject(AuthService);

readonly user = this.authService.user;        // signal<AuthUser | null>
readonly isAuthenticated = this.authService.isAuthenticated; // computed<boolean>
readonly token = this.authService.accessToken; // signal<string | null>
```

- Never read from `localStorage` directly — use `AuthService`
- Never call the refresh endpoint directly — the `authInterceptor` handles it automatically
- To get the current user's role: `this.authService.user()?.role`

---

## 11. Formatting & Code Style

### 11.1 HTML Template Style
```html
<!-- Section headers -->
<h3 class="text-sm font-semibold uppercase tracking-wider text-gray-400">Section Title</h3>

<!-- Page titles -->
<h2 class="text-2xl font-bold text-gray-900">Page Title</h2>

<!-- Data labels -->
<dt class="text-xs text-gray-400">Label</dt>
<dd class="text-sm text-gray-900">{{ value }}</dd>
```

### 11.2 Component File Structure Order
```typescript
// 1. Imports
import { Component, inject, signal, computed, OnInit } from '@angular/core';

// 2. Component decorator
@Component({
  selector: 'app-my-feature',
  standalone: true,
  imports: [...],
  template: `...`,
})

// 3. Class
export class MyFeatureComponent implements OnInit {
  // 3a. Injected services (private readonly)
  private readonly myService = inject(MyService);

  // 3b. Signals and computed (readonly)
  readonly items = signal<ItemResponse[]>([]);
  readonly isLoading = signal(true);
  readonly derivedValue = computed(() => ...);

  // 3c. Mutable form state
  formField = '';

  // 3d. Lifecycle hooks
  ngOnInit(): void { ... }

  // 3e. Public template-facing methods
  handleAction(): void { ... }

  // 3f. Private helpers
  private loadData(): void { ... }
}
```

---

## 12. Anti-Patterns to Reject

| Anti-pattern | Correct alternative |
|---|---|
| `*ngIf`, `*ngFor` directives | `@if`, `@for` control flow blocks |
| `HttpClient` injected in components | Inject the appropriate service |
| Nested `.subscribe()` calls | Use `switchMap`, `forkJoin`, or `combineLatest` |
| `any` type | Proper typed interface |
| `localStorage` accessed directly in components | `AuthService` methods |
| Desktop-only layout (no mobile breakpoints) | Mobile-first with `sm:` breakpoints |
| Ad-hoc card/button/badge styles | Use shared components |
| Loading state not handled | Always show spinner while fetching |
| Error state not handled | Always show error message on failure |
| Empty state not handled | Use `<app-empty-state>` |
| Form submit without validation | Validate before calling service |
| Component fetching data in constructor | Use `ngOnInit` |
| Giant component template (500+ lines) | Extract to sub-components |
| Business logic in templates | Move to component class |
| Raw `Date` objects in signals | Use ISO strings |
