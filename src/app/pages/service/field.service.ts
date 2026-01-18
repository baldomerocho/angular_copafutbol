import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

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

    getFields(): Observable<any> {
        return this.http.get(`${this.baseUrl}/public/fields`);
    }

    getField(id: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/public/fields/${id}`);
    }

    createField(field: Field): Observable<any> {
        const prefix = this.authService.getRolePrefix();
        return this.http.post(`${this.baseUrl}/${prefix}/fields`, field);
    }

    updateField(id: number, field: Field): Observable<any> {
        const prefix = this.authService.getRolePrefix();
        return this.http.put(`${this.baseUrl}/${prefix}/fields/${id}`, field);
    }

    deleteField(id: number): Observable<any> {
        const prefix = this.authService.getRolePrefix();
        return this.http.delete(`${this.baseUrl}/${prefix}/fields/${id}`);
    }
}
