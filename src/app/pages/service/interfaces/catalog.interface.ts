export interface SimpleRelation {
    id: string;
    name: string;
}

export interface Metadata<CatalogsResponse> {
    metadata: CatalogsResponse
}

export interface CatalogsResponse {
    tournament_statuses: SimpleRelation[];
    tournament_types: SimpleRelation[];
    match_statuses: SimpleRelation[];
    match_event_types: SimpleRelation[];
    payment_statuses: SimpleRelation[];
    payment_types: SimpleRelation[];
    user_roles: SimpleRelation[];
}
