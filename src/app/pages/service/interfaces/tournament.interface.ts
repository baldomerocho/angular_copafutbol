export type TournamentType = 'league' | 'knockout' | 'hybrid';
export type TournamentStatus = 'draft' | 'upcoming' | 'ongoing' | 'completed' | 'canceled';

/**
 * Every competition rule lives on the tournament, so one deployment can run a
 * league, a cup and a hybrid at the same time under different rules.
 */
export interface TournamentRules {
    // Format
    double_round: boolean;
    advancing_count: number;
    knockout_legs: number;
    third_place_match: boolean;

    // Scoring
    points_win: number;
    points_draw: number;
    points_loss: number;
    /** Ordered, comma-separated tiebreaker ids, e.g. "goal_difference,goals_for". */
    tiebreakers: string;

    // Discipline
    fair_play_enabled: boolean;
    fair_play_yellow_penalty: number;
    fair_play_red_penalty: number;
    yellow_card_threshold: number;
    yellow_suspension_games: number;
    red_suspension_games: number;

    // Squads
    min_players_per_team: number;
    max_players_per_team: number;

    // Scheduling
    scheduling_day: number;
    scheduling_start_hour: number;
    match_duration_minutes: number;
    slot_interval_minutes: number;
    days_between_rounds: number;
}

export interface TournamentResponse extends TournamentRules {
    id: number;
    name: string;
    season?: string;
    description?: string;
    location?: string;
    logo_url?: string;
    start_date?: string;
    end_date?: string;
    status: TournamentStatus;
    type: TournamentType;

    registration_open: boolean;
    enrollment_price?: number;
    max_teams?: number;
    allow_late_payment?: boolean;
    payment_deadline?: string | null;
    extra_prices?: TournamentExtraPriceResponse[];

    team_count?: number;
    created_at?: string;
}

export interface TournamentRequest extends Partial<TournamentRules> {
    name: string;
    season?: string;
    description?: string;
    location?: string;
    logo_url?: string;
    start_date?: string;
    end_date?: string;
    status?: TournamentStatus;
    type?: TournamentType;

    registration_open?: boolean;
    enrollment_price?: number;
    max_teams?: number;
    allow_late_payment?: boolean;
    payment_deadline?: string | null;
    extra_prices?: TournamentExtraPriceRequest[];
}

export interface TournamentExtraPriceResponse {
    id: number;
    name: string;
    amount: number;
}

export interface TournamentExtraPriceRequest {
    name: string;
    amount: number;
}

export interface TournamentGroupResponse {
    id: number;
    tournament_id: number;
    name: string;
    teams: { id: number; name: string }[];
    team_count: number;
}

export interface TournamentGroupRequest {
    name: string;
    team_ids?: number[];
}

export interface AutoAssignGroupsRequest {
    group_count: number;
    shuffle: boolean;
}

/** Starting point for a brand-new tournament form. */
export const DEFAULT_TOURNAMENT_RULES: TournamentRules = {
    double_round: false,
    advancing_count: 2,
    knockout_legs: 1,
    third_place_match: false,

    points_win: 3,
    points_draw: 1,
    points_loss: 0,
    tiebreakers: 'goal_difference,goals_for,head_to_head,fair_play',

    fair_play_enabled: true,
    fair_play_yellow_penalty: 1,
    fair_play_red_penalty: 3,
    yellow_card_threshold: 3,
    yellow_suspension_games: 1,
    red_suspension_games: 1,

    min_players_per_team: 7,
    max_players_per_team: 25,

    scheduling_day: 6,
    scheduling_start_hour: 9,
    match_duration_minutes: 90,
    slot_interval_minutes: 120,
    days_between_rounds: 7
};
