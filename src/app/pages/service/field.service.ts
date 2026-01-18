import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { BaseResponse } from './interfaces/base.interface';
import { FieldResponse, FieldRequest } from './interfaces/field.interface';

@Injectable({
    providedIn: 'root'
})
export class FieldService {
    private baseUrl = environment.apiUrl;

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    getFields(): Observable<BaseResponse<FieldResponse[]>> {
        return this.http.get(`${this.baseUrl}/public/fields`) as Observable<BaseResponse<FieldResponse[]>>;
    }

    getField(id: number): Observable<BaseResponse<FieldResponse>> {
        return this.http.get(`${this.baseUrl}/public/fields/${id}`) as Observable<BaseResponse<FieldResponse>>;
    }

    createField(field: FieldRequest): Observable<BaseResponse<FieldResponse>> {
        const prefix = this.authService.getRolePrefix();
        return this.http.post(`${this.baseUrl}/${prefix}/fields`, field) as Observable<BaseResponse<FieldResponse>>;
    }

    updateField(id: number, field: FieldRequest): Observable<BaseResponse<FieldResponse>> {
        const prefix = this.authService.getRolePrefix();
        return this.http.put(`${this.baseUrl}/${prefix}/fields/${id}`, field) as Observable<BaseResponse<FieldResponse>>;
    }

    deleteField(id: number): Observable<BaseResponse<any>> {
        const prefix = this.authService.getRolePrefix();
        return this.http.delete(`${this.baseUrl}/${prefix}/fields/${id}`) as Observable<BaseResponse<any>>;
    }
}
