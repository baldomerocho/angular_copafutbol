export interface MatchResponse {
    id: number;
    tournament_id: number;
    field_id?: number;
    field_name?: string;
    group_id?: number;
    home_team_id: number;
    home_team_name: string;
    home_score: number;
    away_team_id: number;
    away_team_name: string;
    away_score: number;
    estimated_start_time: string;
    actual_start_time?: string;
    extra_minutes?: number;
    stage: string;
    status: string;
    created_at?: string;
}

export interface MatchRequest {
    tournament_id: number;
    field_id?: number;
    group_id?: number;
    home_team_id: number;
    away_team_id: number;
    estimated_start_time: string;
    stage?: string;
}

export interface MatchUpdateRequest {
    home_score?: number;
    away_score?: number;
    status?: string;
    actual_start_time?: string;
    extra_minutes?: number;
}

export interface MatchEventRequest {
    type: string;
    minute: number;
    team_id: number;
    player_id?: number;
    description?: string;
    fine_amount?: number;
}

export interface LineupRequest {
    player_id: number;
    position: string;
}
