import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseResponse } from './interfaces/base.interface';
import { CatalogKey, CatalogsResponse, Metadata, SimpleRelation } from './interfaces/catalog.interface';

/**
 * Catalogs hold the Spanish labels for every enum the API uses. They are fetched
 * once at boot from `/public/settings/catalogs` and read synchronously afterwards,
 * so templates can call `label()` without an async pipe.
 */
@Injectable({ providedIn: 'root' })
export class CatalogService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = environment.apiUrl;

    private readonly catalogs = signal<Partial<CatalogsResponse>>({});
    readonly loaded = computed(() => Object.keys(this.catalogs()).length > 0);

    fetchCatalogs(): Observable<BaseResponse<Metadata<CatalogsResponse>>> {
        return this.http
            .get<BaseResponse<Metadata<CatalogsResponse>>>(`${this.baseUrl}/public/settings/catalogs`)
            .pipe(tap((res) => this.catalogs.set(res?.data?.metadata ?? {})));
    }

    /** Every entry of a catalog, ready to feed a p-select. */
    get(key: CatalogKey): SimpleRelation[] {
        return this.catalogs()[key] ?? [];
    }

    /** The Spanish label for an id, falling back to the id when unknown. */
    label(key: CatalogKey, id: string | number | undefined | null): string {
        if (id === undefined || id === null || id === '') return '';
        const found = this.get(key).find((entry) => entry.id === String(id));
        return found?.name ?? String(id);
    }
}
