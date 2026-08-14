import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { BaseResponse } from './interfaces/base.interface';
import { LoginRequest, LoginResponse, RegisterRequest } from './interfaces/auth.interface';
import { UserResponse } from './interfaces/user.interface';

/** Roles the API knows about, ordered from least to most privileged. */
export type UserRole = 'manager' | 'staff' | 'admin';

interface JwtClaims {
    user_id?: number;
    role?: UserRole;
    exp?: number;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = environment.apiUrl;

    /** Current user, kept in a signal so the layout reacts to sign-in and sign-out. */
    readonly currentUser = signal<UserResponse | null>(this.readStoredUser());

    constructor(private http: HttpClient) {}

    /**
     * The API mounts the same handler under /manager, /staff and /admin, and scopes
     * rows by the caller's role. Services build their URLs with this prefix.
     */
    getRolePrefix(): string {
        return this.getUserRole() ?? 'manager';
    }

    login(credentials: LoginRequest): Observable<BaseResponse<LoginResponse>> {
        return this.http.post<BaseResponse<LoginResponse>>(`${this.apiUrl}/login`, credentials).pipe(
            tap((response) => {
                const data = response?.data;
                if (data?.token) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    this.currentUser.set(data.user);
                }
            })
        );
    }

    register(userData: RegisterRequest): Observable<BaseResponse<UserResponse>> {
        return this.http.post<BaseResponse<UserResponse>>(`${this.apiUrl}/register`, userData);
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.currentUser.set(null);
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }

    getUser(): UserResponse | null {
        return this.currentUser();
    }

    setUser(user: UserResponse) {
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUser.set(user);
    }

    /** A session counts as valid only while its token is present and unexpired. */
    isLoggedIn(): boolean {
        const claims = this.readClaims();
        if (!claims) return false;

        if (claims.exp && claims.exp * 1000 <= Date.now()) {
            this.logout();
            return false;
        }
        return true;
    }

    getUserRole(): UserRole | null {
        return this.readClaims()?.role ?? null;
    }

    getUserId(): number | null {
        return this.readClaims()?.user_id ?? null;
    }

    hasRole(requiredRoles: UserRole | UserRole[] | string | string[]): boolean {
        const role = this.getUserRole();
        if (!role) return false;

        return Array.isArray(requiredRoles)
            ? (requiredRoles as string[]).includes(role)
            : requiredRoles === role;
    }

    isManager(): boolean {
        return this.getUserRole() === 'manager';
    }

    isStaffOrAdmin(): boolean {
        return this.hasRole(['staff', 'admin']);
    }

    private readClaims(): JwtClaims | null {
        const token = this.getToken();
        if (!token) return null;

        try {
            const payload = token.split('.')[1];
            const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(atob(normalized)) as JwtClaims;
        } catch {
            return null;
        }
    }

    private readStoredUser(): UserResponse | null {
        const raw = localStorage.getItem('user');
        if (!raw) return null;
        try {
            return JSON.parse(raw) as UserResponse;
        } catch {
            return null;
        }
    }
}
