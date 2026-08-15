import { UserResponse } from './user.interface';

export interface SimpleRelation {
    id: number;
    name: string;
}

/** A club is the institution; it fields one team per division. */
export interface ClubResponse {
    id: number;
    name: string;
    short_name?: string;
    logo_url?: string;
    location?: string;
    founded_in?: number;
    manager_id?: number;
    manager?: UserResponse;
    teams?: TeamResponse[];
    team_count: number;
    created_at?: string;
}

export interface ClubRequest {
    name: string;
    short_name?: string;
    logo_url?: string;
    location?: string;
    founded_in?: number;
    manager_id?: number;
}

/** A team is one squad of a club — its first division, its reserves, its U-17s. */
export interface TeamResponse {
    id: number;
    name: string;
    division?: string;
    club_id?: number;
    club?: SimpleRelation;
    manager_id?: number;
    tournament_id?: number;
    manager?: UserResponse;
    tournament?: SimpleRelation;
    roster?: RosterEntryResponse[];
    player_count: number;
    created_at?: string;
    updated_at?: string;
}

export interface TeamRequest {
    name?: string;
    division?: string;
    club_id?: number | null;
    tournament_id?: number | null;
    manager_id?: number;
}

/** A player is a person, independent of any squad. */
export interface PlayerResponse {
    id: number;
    name: string;
    document?: string;
    birth_date?: string | null;
    age?: number;
    position?: string;
    photo_url?: string;
    phone?: string;
    created_at?: string;
}

export interface PlayerRequest {
    name: string;
    document?: string;
    birth_date?: string | null;
    position?: string;
    photo_url?: string;
    phone?: string;
}

/** A roster entry: this person wears this number for this squad. */
/** Someone on the club's books — the pool a tournament entry is drawn from. */
export interface ClubPlayerResponse {
    id: number;
    club_id: number;
    player_id: number;
    player: PlayerResponse;
    position?: string;
    number: number;
    active: boolean;
    /** Tournaments this person is currently entered in. */
    registered_in: string[];
}

export interface ClubPlayerRequest {
    player_id?: number;
    name?: string;
    document?: string;
    birth_date?: string | null;
    position?: string;
    number?: number;
    photo_url?: string;
    phone?: string;
    active?: boolean;
}

/** What entering the club's players into a tournament squad did. */
export interface CopyPoolResponse {
    registered: number;
    pending_approval: number;
    already_on: number;
    skipped: { player_id: number; player_name: string; reason: string }[];
}

export interface RosterEntryResponse {
    id: number;
    team_id: number;
    /** Only filled where the squad is not implied by the request — the player's card. */
    team_name?: string;
    division?: string;
    player_id: number;
    player: PlayerResponse;
    number: number;
    position?: string;
    is_captain: boolean;
    active: boolean;
    suspended: boolean;
    /** False while an authorisation is pending, or approved but unpaid. */
    eligible: boolean;
    /** Set when the entry needed an authorisation, so the squad list can say why. */
    waiver_status?: 'pending' | 'approved' | 'rejected';
    waiver_rule?: string;
}

/**
 * Registering a player: pass player_id for someone already in the system, or
 * their details to create and register them at once — the document is what
 * decides whether the person already exists.
 */
export interface RosterEntryRequest {
    /** Justification carried onto any authorisation the registration needs. */
    reason?: string;
    player_id?: number;
    name?: string;
    document?: string;
    birth_date?: string | null;
    phone?: string;
    number: number;
    position?: string;
    is_captain?: boolean;
}

/** Payment progress of one enrolled team, used by the arrears panel. */
export interface MonitoringTeamStatus {
    team_id: number;
    team_name: string;
    manager_name: string;
    tournament_name: string;
    total_expected: number;
    total_paid: number;
    status_percentage: number;
    missing_payments: MissingPayment[];
    is_fully_paid: boolean;
}

export interface MissingPayment {
    name: string;
    amount: number;
    type: string;
}
