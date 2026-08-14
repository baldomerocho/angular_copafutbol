export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'rescheduled' | 'canceled';
export type MatchStage = 'group' | 'round-of-32' | 'round-of-16' | 'quarter-final' | 'semi-final' | 'third-place' | 'final';
export type MatchEventType = 'goal' | 'yellow_card' | 'red_card' | 'foul' | 'fine';

export interface MatchResponse {
    id: number;
    tournament_id: number;
    field_id?: number;
    field_name?: string;
    group_id?: number;
    group_name?: string;
    home_team_id: number;
    home_team_name: string;
    home_score: number;
    away_team_id: number;
    away_team_name: string;
    away_score: number;
    estimated_start_time: string;
    actual_start_time?: string;
    extra_minutes?: number;
    stage: MatchStage;
    round: number;
    status: MatchStatus;
    created_at?: string;
}

export interface MatchRequest {
    tournament_id: number;
    field_id?: number;
    group_id?: number;
    home_team_id: number;
    away_team_id: number;
    estimated_start_time: string;
    stage?: MatchStage;
}

/**
 * Every field is optional: the API only touches what the payload actually carries,
 * so sending `{status}` alone will not reset the score.
 */
export interface MatchUpdateRequest {
    estimated_start_time?: string;
    actual_start_time?: string;
    field_id?: number;
    extra_minutes?: number;
    status?: MatchStatus;
    home_score?: number;
    away_score?: number;
}

export interface MatchEventRequest {
    type: MatchEventType;
    minute: number;
    team_id: number;
    player_id?: number | null;
    description?: string;
    fine_amount?: number;
}

export interface MatchEventResponse {
    id: number;
    match_id: number;
    team_id: number;
    team_name: string;
    player_id?: number;
    player_name: string;
    type: MatchEventType;
    minute: number;
    description: string;
    fine_amount: number;
    is_paid: boolean;
    created_at?: string;
}

export interface LineupRequest {
    player_id: number;
    position: string;
    starter: boolean;
}

export interface LineupBulkRequest {
    players: LineupRequest[];
}

export interface LineupResponse {
    id: number;
    match_id: number;
    player_id: number;
    player_name: string;
    player_number: number;
    team_id: number;
    position: string;
    starter: boolean;
    suspended: boolean;
}

export interface MatchDetailsResponse {
    match: MatchResponse;
    events: MatchEventResponse[];
    lineups: LineupResponse[];
}

// --- Standings ---

export interface StandingsEntry {
    position: number;
    team_id: number;
    team_name: string;
    matches_played: number;
    wins: number;
    draws: number;
    losses: number;
    goals_for: number;
    goals_against: number;
    goal_difference: number;
    points: number;
    yellow_cards: number;
    red_cards: number;
    fair_play_score: number;
    /** Most recent results, newest last, e.g. "WWDLW". */
    form: string;
    is_advancing: boolean;
}

export interface GroupStandings {
    group_id?: number;
    group_name: string;
    entries: StandingsEntry[];
}

export interface StandingsResponse {
    tournament_id: number;
    tournament_name: string;
    type: string;
    tiebreakers: string[];
    points_win: number;
    points_draw: number;
    groups: GroupStandings[];
}

export interface BracketRound {
    stage: MatchStage;
    label: string;
    matches: MatchResponse[];
}

export interface PlayerStatsResponse {
    player_id: number;
    player_name: string;
    player_number: number;
    team_id: number;
    team_name: string;
    goals: number;
    yellows: number;
    reds: number;
}

// --- Suspensions ---

export interface SuspensionResponse {
    id: number;
    player_id: number;
    player_name: string;
    team_id: number;
    team_name: string;
    tournament_id: number;
    match_event_id: number;
    reason: string;
    matches_count: number;
    matches_served: number;
    is_active: boolean;
    end_date?: string | null;
    created_at: string;
}

export interface SuspensionUpdateRequest {
    matches_count?: number;
    matches_served?: number;
    is_active?: boolean;
}
