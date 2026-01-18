import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

export interface CatalogItem {
    id: string;
    name: string;
}

export interface CatalogsMetadata {
    match_event_types: CatalogItem[];
    match_stages: CatalogItem[];
    match_statuses: CatalogItem[];
    payment_statuses: CatalogItem[];
    payment_types: CatalogItem[];
    tournament_statuses: CatalogItem[];
    tournament_types: CatalogItem[];
    user_roles: CatalogItem[];
}

@Injectable({
    providedIn: 'root'
})
export class CatalogService {
    private baseUrl = 'https://app-dev-clubfutbol.server.gt';

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
