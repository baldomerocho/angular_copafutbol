export interface PaginationMeta {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from?: number;
    to?: number;
    path?: string;
}

export interface BaseResponse<T> {
    data: T;
    message?: string;
    meta?: PaginationMeta;
}

/** What a table asks the API for. Omit both and the API returns everything. */
export interface Paging {
    page?: number;
    per_page?: number;
}
