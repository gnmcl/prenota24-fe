---
target: agenda
total_score: 20
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
timestamp: 2026-08-04T22-33-08Z
slug: src-app-features-agenda-agenda-component-ts
---
Method: dual-agent (A: /root/agenda_design_review · B: /root/agenda_detector_evidence)

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of system status | 2/4 | No failed-API, availability, or current-time feedback. |
| 2 | Match between system and real world | 3/4 | Familiar daily schedule; capacity-dot meanings are implicit. |
| 3 | User control and freedom | 2/4 | Good date navigation, but no explicit “Oggi”, undo, or clear rejection path. |
| 4 | Consistency and standards | 2/4 | Shared status language works, but the screen hard-codes visual tokens and uses raw controls. |
| 5 | Error prevention | 1/4 | A click can start appointment creation without explaining unavailable or conflicting times. |
| 6 | Recognition rather than recall | 2/4 | Availability hatching and capacity dots require users to remember their meanings. |
| 7 | Flexibility and efficiency | 3/4 | List/calendar and fast date selection help; filters, professional focus, keyboard paths and “Oggi” are absent. |
| 8 | Aesthetic and minimalist design | 3/4 | Clear and restrained, though the three date-navigation layers duplicate each other. |
| 9 | Help users recognize and recover from errors | 1/4 | No visible failure state, blocked-slot explanation, or recovery CTA. |
| 10 | Help and documentation | 1/4 | No cue for click-to-create, hatching, or capacity levels. |
| **Total** |  | **20/40** | **Needs focused operational UX work** |

## Design Specificity Verdict

The day-by-professional grid, availability hatching, service legend, and weekly capacity signals make this a real appointment-operations surface rather than a generic list. It is still partly category-interchangeable because the navigation, colour-only metadata, and empty grid do not explain their operational meaning; it also does not adapt its mental model to the professional role.

The deterministic scan found one warning at `src/app/features/agenda/agenda.component.ts:295`: `ai-color-palette`, triggered by the `from-indigo-50` gradient. This reinforces the design review’s concern that the indigo treatment is decorative rather than meaningfully tied to scheduling. Browser overlay injection was unavailable: the in-app browser exposes no mutable script/evaluation API, so no reliable user-visible overlay or console evidence was produced.

## Overall Impression

The agenda has a strong scheduling foundation and is easy to recognize, but it needs to make availability, permissions, and recovery explicit before it can be trusted during a busy day.

## What's Working

- The daily staff-column schedule is an effective operational metaphor; availability overlays show that the screen understands real scheduling constraints.
- Full-date navigation, the picker, and the week strip support different navigation granularity.
- List mode provides a concise, scannable fallback for appointments.

## Priority Issues

### [P0] Role model conflicts with the screen’s scope

**Why it matters:** The route admits PROFESSIONAL users while the component fetches admin services and displays every active professional. A professional can encounter an unauthorised or confusing team-level agenda.

**Fix:** Make the route admin-only, or build an explicitly scoped professional agenda through `ProfessionalPortalService`; use a one-column personal view and hide unauthorised creation actions.

**Suggested command:** `/impeccable harden agenda`

### [P1] Blocked or invalid slots fail silently

**Why it matters:** A striped interval does not state whether it is non-working, exceptional, booked, or otherwise unavailable. A click may appear to do nothing, while a free click immediately begins creation.

**Fix:** Add text/accessibility descriptions and a visible feedback message for blocked slots. For valid slots, show an explicit “Nuovo alle HH:mm” affordance or lightweight prefill confirmation and validate overlap/duration before portraying it as selectable.

**Suggested command:** `/impeccable harden agenda`

### [P1] The page has no robust error or actionable empty state

**Why it matters:** An appointments or availability API failure can look like a legitimate empty day, losing trust exactly when staff need certainty.

**Fix:** Add typed error alerts with retry for appointments and availability, distinguish loading from failure, and use an empty state with a creation CTA while preserving the selected day.

**Suggested command:** `/impeccable harden agenda`

### [P1] Dark mode and dense calendar visuals rely on hard-coded colours

**Why it matters:** `bg-white`, `text-gray-*`, manual service colours and tiny appointment text reduce contrast and consistency in a schedule that must be read quickly.

**Fix:** Replace hard-coded surfaces/text with semantic tokens; test status, hatch, service-colour contrast, and appointment labels in dark mode. Give appointments descriptive aria-labels and ensure key status is not colour-only.

**Suggested command:** `/impeccable adapt agenda`

### [P2] Navigation chrome duplicates the same decision

**Why it matters:** Previous/next arrows, a picker, and a seven-day strip stack three ways of changing date, consuming mobile space and diluting hierarchy.

**Fix:** Keep back / explicit “Oggi” / forward in the header and retain the week strip as contextual selection. Add a compact text legend for capacity markers.

**Suggested command:** `/impeccable layout agenda`

## Persona Red Flags

- **Solo professional on phone:** Faces a multi-staff grid and horizontal scrolling while serving a client; access may also be inconsistent with their portal permissions.
- **Studio receptionist at peak time:** Cannot tell why a striped interval rejects a click or whether a yellow/red date dot represents studio-wide or per-professional capacity.
- **Low-vision or colour-vision-different coordinator:** Must parse 8–10px labels, red/yellow/green dots, hatching, and service colours without equivalent text or accessible labels.

## Minor Observations

- Icon-only date controls and view toggles need accessible labels and pressed semantics.
- Fixed 07:00–21:00 hours can hide real appointments outside this window.
- A large service catalogue can turn the legend into low-value wrapping noise; collapse it or make it a filter.
- `SNAP_MINUTES` says five minutes while the interaction uses fifteen-minute increments; align the implementation and its intent.
