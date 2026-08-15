import { signal } from '@angular/core';
import { TableLazyLoadEvent } from 'primeng/table';
import { Observable } from 'rxjs';
import { BaseResponse, Paging } from '../service/interfaces/base.interface';

/**
 * The wiring every server-paged table needs, in one place.
 *
 * A `[lazy]` p-table fires `onLazyLoad` once on init and again on every page
 * change, so that event is the *only* thing that loads data — a component that
 * also calls `load()` in `ngOnInit` fires two requests for the first page.
 *
 * Filtering has to go to the server too. Once the browser only holds one page,
 * a client-side filter would search that page and quietly claim the rest does
 * not match, so `setSearch` and `reload` both return to page one and re-ask.
 */
export class ServerTable<T> {
    readonly rows = signal<T[]>([]);
    readonly total = signal(0);
    readonly loading = signal(true);

    first = 0;
    perPage: number;
    search = '';

    private searchTimer?: ReturnType<typeof setTimeout>;

    /**
     * @param fetch  Called with the page to read; the component adds its own filters.
     * @param perPage Initial page size, matched to the table's `[rows]`.
     */
    constructor(
        private readonly fetch: (paging: Paging) => Observable<BaseResponse<T[]>>,
        perPage = 15
    ) {
        this.perPage = perPage;
    }

    /** Bind to `(onLazyLoad)`. */
    onLazyLoad(event: TableLazyLoadEvent) {
        this.first = event.first ?? 0;
        this.perPage = event.rows ?? this.perPage;
        this.load();
    }

    /** Call after any filter changes: a narrower result makes the offset meaningless. */
    reload() {
        this.first = 0;
        this.load();
    }

    /** Bind to the search box. Debounced so typing does not fire a request per key. */
    setSearch(term: string) {
        this.search = term ?? '';
        clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => this.reload(), 350);
    }

    /** Re-read the current page — after a create, an edit or a delete. */
    refresh() {
        this.load();
    }

    /** Deleting the last row of the last page would otherwise show an empty table. */
    refreshAfterDelete() {
        if (this.rows().length === 1 && this.first > 0) {
            this.first = Math.max(0, this.first - this.perPage);
        }
        this.load();
    }

    private load() {
        this.loading.set(true);
        this.fetch({ page: Math.floor(this.first / this.perPage) + 1, per_page: this.perPage }).subscribe({
            next: (res) => {
                const data = res.data ?? [];
                this.rows.set(data);
                // Without meta the API returned everything, so the page is the whole set.
                this.total.set(res.meta?.total ?? data.length);
                this.loading.set(false);
            },
            error: () => {
                this.rows.set([]);
                this.loading.set(false);
            }
        });
    }
}
