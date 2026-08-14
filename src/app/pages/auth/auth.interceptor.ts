import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../service/auth.service';

/**
 * Attaches the JWT to every call that targets our own API and signs the user out
 * when the API rejects the token.
 *
 * The check is against `environment.apiUrl` rather than a hardcoded host: a
 * literal dev hostname silently stops matching in production, which leaves every
 * authenticated request unauthenticated.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const isOwnApi = req.url.startsWith(environment.apiUrl) || req.url.startsWith('/');
    const token = authService.getToken();

    const request = isOwnApi && token
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;

    return next(request).pipe(
        catchError((error: HttpErrorResponse) => {
            // An expired or revoked session should land on the login screen instead of
            // leaving the app in a half-logged-in state.
            if (isOwnApi && error.status === 401 && authService.isLoggedIn()) {
                authService.logout();
                router.navigate(['/auth/login'], {
                    queryParams: { returnUrl: router.url, expired: true }
                });
            }
            return throwError(() => error);
        })
    );
};
