import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../service/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isLoggedIn()) {
        const requiredRoles = route.data['roles'] as Array<string>;
        if (!requiredRoles || authService.hasRole(requiredRoles)) {
            return true;
        }

        // If logged in but lacks role, redirect to unauthorized (dashboard for now)
        router.navigate(['/']);
        return false;
    }

    // Redirect to login page if not authenticated
    router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
    return false;
};
