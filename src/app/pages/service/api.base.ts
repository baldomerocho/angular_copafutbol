import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

/**
 * Shared plumbing for the API services.
 *
 * The backend mounts the same handler under /manager, /staff and /admin and scopes
 * the rows it returns by the caller's role, so a service only has to build the URL
 * with the right prefix — hence `scoped()`. Read-only endpoints that anyone may
 * see live under /public and use `pub()`.
 */
export abstract class ApiBase {
    protected readonly http = inject(HttpClient);
    protected readonly auth = inject(AuthService);
    protected readonly baseUrl = environment.apiUrl;

    /** URL under the caller's role prefix. */
    protected scoped(path: string): string {
        return `${this.baseUrl}/${this.auth.getRolePrefix()}${path}`;
    }

    /** URL under the unauthenticated /public prefix. */
    protected pub(path: string): string {
        return `${this.baseUrl}/public${path}`;
    }

    /** Builds query params, dropping empty values so they never reach the API. */
    protected params(source: object | undefined): HttpParams {
        let params = new HttpParams();
        if (!source) return params;

        for (const [key, value] of Object.entries(source)) {
            if (value === undefined || value === null || value === '') continue;
            params = params.set(key, String(value));
        }
        return params;
    }
}
