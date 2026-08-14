import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiBase } from './api.base';
import { BaseResponse } from './interfaces/base.interface';
import {
    UserCreateRequest,
    UserResponse,
    UserUpdatePasswordRequest,
    UserUpdateProfileRequest,
    UserUpdateRequest
} from './interfaces/user.interface';

@Injectable({ providedIn: 'root' })
export class UserService extends ApiBase {
    /**
     * Admins manage every account under /admin/users; staff may only manage team
     * managers, which the API exposes as /staff/managers.
     */
    private endpoint(): string {
        return this.auth.getRolePrefix() === 'admin'
            ? `${this.baseUrl}/admin/users`
            : `${this.baseUrl}/staff/managers`;
    }

    getUsers(role?: string): Observable<BaseResponse<UserResponse[]>> {
        return this.http.get<BaseResponse<UserResponse[]>>(this.endpoint(), {
            params: this.params({ role })
        });
    }

    getUser(id: number): Observable<BaseResponse<UserResponse>> {
        return this.http.get<BaseResponse<UserResponse>>(`${this.endpoint()}/${id}`);
    }

    createUser(user: UserCreateRequest): Observable<BaseResponse<UserResponse>> {
        return this.http.post<BaseResponse<UserResponse>>(this.endpoint(), user);
    }

    updateUser(id: number, user: UserUpdateRequest): Observable<BaseResponse<UserResponse>> {
        return this.http.put<BaseResponse<UserResponse>>(`${this.endpoint()}/${id}`, user);
    }

    deleteUser(id: number): Observable<BaseResponse<void>> {
        return this.http.delete<BaseResponse<void>>(`${this.endpoint()}/${id}`);
    }

    // --- Own profile ---

    getProfile(): Observable<BaseResponse<UserResponse>> {
        return this.http.get<BaseResponse<UserResponse>>(`${this.baseUrl}/profile`);
    }

    updateProfile(user: UserUpdateProfileRequest): Observable<BaseResponse<UserResponse>> {
        return this.http.put<BaseResponse<UserResponse>>(`${this.baseUrl}/profile`, user).pipe(
            // Keep the topbar in sync with the name the user just changed.
            tap((res) => res?.data && this.auth.setUser(res.data))
        );
    }

    updatePassword(passwordData: UserUpdatePasswordRequest): Observable<BaseResponse<UserResponse>> {
        return this.http.put<BaseResponse<UserResponse>>(`${this.baseUrl}/profile/password`, passwordData);
    }
}
