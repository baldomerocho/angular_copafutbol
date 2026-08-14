/** A catalog entry: the id the API stores, and the Spanish label the UI shows. */
export interface SimpleRelation {
    id: string;
    name: string;
}

export interface Metadata<T> {
    metadata: T;
}

/**
 * Catalogs are served from the `catalogs` setting, which the API rewrites on every
 * boot. Adding an enum on the backend surfaces here without a frontend release.
 */
export interface CatalogsResponse {
    tournament_statuses: SimpleRelation[];
    tournament_types: SimpleRelation[];
    match_statuses: SimpleRelation[];
    match_stages: SimpleRelation[];
    match_event_types: SimpleRelation[];
    payment_statuses: SimpleRelation[];
    payment_types: SimpleRelation[];
    user_roles: SimpleRelation[];
    tiebreakers: SimpleRelation[];
    knockout_tiebreaks: SimpleRelation[];
    lineup_positions: SimpleRelation[];
    player_positions: SimpleRelation[];
    team_divisions: SimpleRelation[];
    weekdays: SimpleRelation[];
}

export type CatalogKey = keyof CatalogsResponse;
