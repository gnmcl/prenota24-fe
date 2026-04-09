import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import type { AppUserRole } from '../models/domain.model';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.user();

  if (!user) {
    return router.createUrlTree(['/accedi']);
  }

  const allowed: AppUserRole[] = route.data['allowed'] ?? [];

  if (!allowed.includes(user.role)) {
    const fallback = user.role === 'ADMIN' ? '/dashboard' : '/agenda';
    return router.createUrlTree([fallback]);
  }

  return true;
};
