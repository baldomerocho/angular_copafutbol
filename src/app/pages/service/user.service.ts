import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseResponse } from './interfaces/base.interface';
import { UserResponse, UserCreateRequest, UserUpdateRequest, UserUpdateProfileRequest, UserUpdatePasswordRequest } from './interfaces/user.interface';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private baseUrl = environment.apiUrl;

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    private getEndpoint(): string {
        const prefix = this.authService.getRolePrefix();
        return prefix === 'admin' ? 'admin/users' : 'staff/managers';
    }

    getUsers(): Observable<BaseResponse<UserResponse[]>> {
        return this.http.get(`${this.baseUrl}/${this.getEndpoint()}`) as Observable<BaseResponse<UserResponse[]>>;
    }

    createUser(user: UserCreateRequest): Observable<BaseResponse<UserResponse>> {
        return this.http.post(`${this.baseUrl}/${this.getEndpoint()}`, user) as Observable<BaseResponse<UserResponse>>;
    }

    updateUser(id: number, user: UserUpdateRequest): Observable<BaseResponse<UserResponse>> {
        return this.http.put(`${this.baseUrl}/${this.getEndpoint()}/${id}`, user) as Observable<BaseResponse<UserResponse>>;
    }

    deleteUser(id: number): Observable<BaseResponse<void>> {
        return this.http.delete(`${this.baseUrl}/${this.getEndpoint()}/${id}`) as Observable<BaseResponse<void>>;
    }

    // Profile Management
    getProfile(): Observable<BaseResponse<UserResponse>> {
        return this.http.get(`${this.baseUrl}/profile`) as Observable<BaseResponse<UserResponse>>;
    }

    updateProfile(user: UserUpdateProfileRequest): Observable<BaseResponse<UserResponse>> {
        return this.http.put(`${this.baseUrl}/profile`, user) as Observable<BaseResponse<UserResponse>>;
    }

    updatePassword(passwordData: UserUpdatePasswordRequest): Observable<BaseResponse<void>> {
        return this.http.put(`${this.baseUrl}/profile/password`, passwordData) as Observable<BaseResponse<void>>;
    }
}
