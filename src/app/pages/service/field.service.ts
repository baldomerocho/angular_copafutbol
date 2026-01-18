import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { BaseResponse } from './interfaces/base.interface';
import { Field } from './interfaces/field.interface';

@Injectable({
    providedIn: 'root'
})
export class FieldService {
    private baseUrl = environment.apiUrl;

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    getFields(): Observable<BaseResponse<Field[]>> {
        return this.http.get(`${this.baseUrl}/public/fields`) as Observable<BaseResponse<Field[]>>;
    }

    getField(id: number): Observable<BaseResponse<Field>> {
        return this.http.get(`${this.baseUrl}/public/fields/${id}`) as Observable<BaseResponse<Field>>;
    }

    createField(field: Field): Observable<BaseResponse<Field>> {
        const prefix = this.authService.getRolePrefix();
        return this.http.post(`${this.baseUrl}/${prefix}/fields`, field) as Observable<BaseResponse<Field>>;
    }

    updateField(id: number, field: Field): Observable<BaseResponse<Field>> {
        const prefix = this.authService.getRolePrefix();
        return this.http.put(`${this.baseUrl}/${prefix}/fields/${id}`, field) as Observable<BaseResponse<Field>>;
    }

    deleteField(id: number): Observable<BaseResponse<any>> {
        const prefix = this.authService.getRolePrefix();
        return this.http.delete(`${this.baseUrl}/${prefix}/fields/${id}`) as Observable<BaseResponse<any>>;
    }
}
