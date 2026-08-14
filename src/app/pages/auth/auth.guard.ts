import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateChildFn, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../service/auth.service';

/**
 * Guards a route and everything under it.
 *
 * `canActivate` on a parent route only ever sees the parent's own `data`, so the
 * `data: { roles: [...] }` declared on child routes needs `canActivateChild` to be
 * enforced. Both are exported and both are wired in app.routes.ts.
 */
function check(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isLoggedIn()) {
        router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
        return false;
    }

    const requiredRoles = route.data?.['roles'] as string[] | undefined;
    if (requiredRoles?.length && !authService.hasRole(requiredRoles)) {
        router.navigate(['/acceso-denegado']);
        return false;
    }

    return true;
}

export const authGuard: CanActivateFn = (route, state) => check(route, state);
export const authChildGuard: CanActivateChildFn = (route, state) => check(route, state);
