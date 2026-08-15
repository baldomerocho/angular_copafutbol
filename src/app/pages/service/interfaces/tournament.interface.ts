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

    /** Ordered chain applied when a knockout tie ends level. */
    knockout_tiebreaks: string;

    // Squads
    min_players_per_team: number;
    max_players_per_team: number;
    min_player_age: number;
    max_player_age: number;

    // Eligibility. Each rule is a three-state policy rather than a switch, because
    // most of them are decisions an organizer wants to make case by case.
    /** One person on two squads of this same competition. */
    policy_other_team_same_tournament: EligibilityPolicy;
    /** Already registered in a different tournament that is still running. */
    policy_other_active_tournament: EligibilityPolicy;
    /** No national identity document on file. */
    policy_missing_document: EligibilityPolicy;
    /** Outside min_player_age..max_player_age. */
    policy_outside_age_range: EligibilityPolicy;

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
    /** ISO code; every amount of this tournament is shown in it. */
    currency?: string;
    fees?: TournamentFeeResponse[];

    /** Filled on the tournament detail, and on listings for finished tournaments. */
    podium?: PodiumResponse | null;

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
    currency?: string;
    fees?: TournamentFeeRequest[];
}

/** Who won, once a tournament is actually decided. Absent until then. */
export interface PodiumResponse {
    champion_id: number;
    champion_name: string;
    runner_up_id: number;
    runner_up_name: string;
    third_id?: number;
    third_name?: string;
}

/** What a tournament does when a player breaks one of its squad rules. */
export type EligibilityPolicy = 'allowed' | 'requires_approval' | 'blocked';

/** One line of a tournament's rate card. The code is what links a charge to what it pays for. */
export interface TournamentFeeResponse {
    id?: number;
    code: string;
    name: string;
    amount: number;
    mandatory: boolean;
}

export interface TournamentFeeRequest {
    code: string;
    name: string;
    amount: number;
    mandatory: boolean;
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

    knockout_tiebreaks: 'extra_time,penalties',

    min_players_per_team: 7,
    max_players_per_team: 25,
    min_player_age: 0,
    max_player_age: 0,

    policy_other_team_same_tournament: 'blocked',
    policy_other_active_tournament: 'allowed',
    policy_missing_document: 'allowed',
    policy_outside_age_range: 'blocked',

    scheduling_day: 6,
    scheduling_start_hour: 9,
    match_duration_minutes: 90,
    slot_interval_minutes: 120,
    days_between_rounds: 7
};
