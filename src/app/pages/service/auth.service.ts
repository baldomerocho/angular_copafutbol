import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { BaseResponse } from './interfaces/base.interface';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    getRolePrefix(): string {
        console.log("ENV:: ", environment.production)
        const role = this.getUserRole();
        if (role === 'admin') return 'admin';
        if (role === 'staff') return 'staff';
        return 'manager';
    }

    login(credentials: any): Observable<BaseResponse<any>> {
        return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
            tap((response: any) => {
                if (response.data && response.data.token) {
                    localStorage.setItem('token', response.data.token);
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                }
            })
        ) as Observable<BaseResponse<any>>;
    }

    register(userData: any): Observable<BaseResponse<any>> {
        return this.http.post(`${this.apiUrl}/register`, userData) as Observable<BaseResponse<any>>;
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    getToken() {
        return localStorage.getItem('token');
    }

    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    getUserRole(): string | null {
        const token = this.getToken();
        if (!token) return null;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.role || null;
        } catch (e) {
            return null;
        }
    }

    hasRole(requiredRoles: string | string[]): boolean {
        const userRole = this.getUserRole();
        if (!userRole) return false;

        if (Array.isArray(requiredRoles)) {
            return requiredRoles.includes(userRole);
        }
        return userRole === requiredRoles;
    }
}
