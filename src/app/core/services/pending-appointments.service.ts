import { Injectable, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { combineLatest, interval, of } from 'rxjs';
import { startWith, switchMap, catchError, distinctUntilChanged, map } from 'rxjs';
import { AppointmentService } from './appointment.service';
import { ProfessionalPortalService } from './professional-portal.service';
import { AuthService } from './auth.service';

/**
 * Polls every 30 seconds for REQUESTED appointments.
 * Resets immediately on logout / role change.
 * Used by PageShellComponent to show the badge on the Appuntamenti nav item.
 */
@Injectable({ providedIn: 'root' })
export class PendingAppointmentsService {
  private readonly authService = inject(AuthService);
  private readonly appointmentService = inject(AppointmentService);
  private readonly portalService = inject(ProfessionalPortalService);

  readonly pendingCount = signal(0);

  /** Immediately fetch and update the count — call after confirming/cancelling an appointment. */
  forceRefresh(): void {
    const role = this.authService.user()?.role;
    if (!role) { this.pendingCount.set(0); return; }
    const fetch$ = role === 'ADMIN'
      ? this.appointmentService.list(0, 1, 'REQUESTED')
      : this.portalService.listAppointments(0, 1, 'REQUESTED');
    fetch$.pipe(catchError(() => of(null))).subscribe(page => {
      this.pendingCount.set(page?.page?.totalElements ?? 0);
    });
  }

  constructor() {
    const userRole$ = toObservable(this.authService.user).pipe(
      map(user => (user ? user.role : null)),
      distinctUntilChanged(),
    );

    combineLatest([
      userRole$,
      interval(30_000).pipe(startWith(0)),
    ])
      .pipe(
        switchMap(([role]) => {
          if (!role) {
            this.pendingCount.set(0);
            return of(null);
          }
          if (role === 'ADMIN') {
            return this.appointmentService
              .list(0, 1, 'REQUESTED')
              .pipe(catchError(() => of(null)));
          }
          if (role === 'PROFESSIONAL') {
            return this.portalService
              .listAppointments(0, 1, 'REQUESTED')
              .pipe(catchError(() => of(null)));
          }
          return of(null);
        }),
      )
      .subscribe(page => {
        this.pendingCount.set(page?.page?.totalElements ?? 0);
      });
  }
}
