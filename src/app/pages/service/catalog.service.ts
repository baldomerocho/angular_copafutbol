import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

import { CatalogItem, CatalogsMetadata } from './interfaces/catalog.interface';

@Injectable({
    providedIn: 'root'
})
export class CatalogService {
    private baseUrl = environment.apiUrl;

    // Using signals for easy access to catalogs across the app
    catalogs = signal<CatalogsMetadata | null>(null);

    constructor(private http: HttpClient) { }

    fetchCatalogs(): Observable<any> {
        return this.http.get(`${this.baseUrl}/public/settings/catalogs`).pipe(
            tap((res: any) => {
                if (res.data && res.data.metadata) {
                    this.catalogs.set(res.data.metadata);
                }
            })
        );
    }

    getCatalog(key: keyof CatalogsMetadata): CatalogItem[] {
        const current = this.catalogs();
        return current ? current[key] : [];
    }
}
