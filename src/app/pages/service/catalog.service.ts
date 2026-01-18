import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseResponse } from './interfaces/base.interface';
import { CatalogsResponse, SimpleRelation, Metadata } from './interfaces/catalog.interface';

@Injectable({
    providedIn: 'root'
})
export class CatalogService {
    private baseUrl = environment.apiUrl;
    private catalogs = new BehaviorSubject<CatalogsResponse | null>(null);

    constructor(private http: HttpClient) { }

    fetchCatalogs(): Observable<BaseResponse<Metadata<CatalogsResponse>>> {
        const response = this.http.get(`${this.baseUrl}/public/settings/catalogs`) as Observable<BaseResponse<Metadata<CatalogsResponse>>>;
        response.subscribe((res) => {
            this.setCatalogs(res.data.metadata);
        });
        return response;
    }

    setCatalogs(catalogs: CatalogsResponse) {
        this.catalogs.next(catalogs);
    }

    getCatalog(key: keyof CatalogsResponse): SimpleRelation[] {
        return this.catalogs.value ? this.catalogs.value[key] : [];
    }
}
