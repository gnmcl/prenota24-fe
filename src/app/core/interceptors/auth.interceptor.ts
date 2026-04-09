import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import type { ApiErrorResponse } from '../models/domain.model';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.accessToken();

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
        window.location.href = '/accedi';
        return throwError(() => error.error as ApiErrorResponse);
      }

      const normalised: ApiErrorResponse = {
        status: error.status || 0,
        message: error.error?.message ?? error.message ?? 'Network error – please check your connection.',
        errors: error.error?.errors,
      };
      return throwError(() => normalised);
    }),
  );
};
