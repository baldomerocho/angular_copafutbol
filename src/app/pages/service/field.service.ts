import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Field {
    id?: number;
    name: string;
    location?: string;
    capacity?: number;
}

@Injectable({
    providedIn: 'root'
})
export class FieldService {
    private baseUrl = 'https://app-dev-clubfutbol.server.gt';

    constructor(private http: HttpClient) { }

    getFields(): Observable<any> {
        return this.http.get(`${this.baseUrl}/public/fields`);
    }

    getField(id: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/public/fields/${id}`);
    }

    createField(field: Field): Observable<any> {
        return this.http.post(`${this.baseUrl}/admin/fields`, field);
    }

    updateField(id: number, field: Field): Observable<any> {
        return this.http.put(`${this.baseUrl}/admin/fields/${id}`, field);
    }

    deleteField(id: number): Observable<any> {
        return this.http.delete(`${this.baseUrl}/admin/fields/${id}`);
    }
}
