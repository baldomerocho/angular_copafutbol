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
