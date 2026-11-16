import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, switchMap, throwError, from } from 'rxjs';
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
      // Skip refresh for auth endpoints to avoid infinite loops
      if (error.status === 401 && !req.url.includes('/auth/')) {
        return from(authService.refreshAccessToken()).pipe(
          switchMap(response => {
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${response.accessToken}` },
            });
            return next(retryReq);
          }),
          // A failed retry reports its own error; a failed refresh reports the original 401.
          catchError((retryError: unknown) =>
            throwError(() => toApiError(retryError instanceof HttpErrorResponse ? retryError : error)),
          ),
        );
      }

      if (error.status === 401) {
        authService.logout();
        window.location.href = '/accedi';
        return throwError(() => toApiError(error));
      }

      return throwError(() => toApiError(error));
    }),
  );
};

/** Maps an HTTP failure to the backend ErrorResponse shape, also for network errors with no body. */
function toApiError(error: HttpErrorResponse): ApiErrorResponse {
  const body: Partial<ApiErrorResponse> | null =
    typeof error.error === 'object' && error.error !== null ? error.error : null;
  return {
    status: body?.status ?? error.status,
    error: body?.error,
    message: body?.message ?? error.message ?? 'Network error – please check your connection.',
    path: body?.path,
    timestamp: body?.timestamp,
  };
}
