export interface TournamentResponse {
    id: number;
    name: string;
    description?: string;
    location?: string;
    start_date?: string;
    end_date?: string;
    max_teams?: number;
    enrollment_price?: number;
    status?: string;
    type?: string;
    fair_play_enabled?: boolean;
    allow_late_payment?: boolean;
    advancing_count?: number;
    yellow_card_threshold?: number;
    scheduling_day?: number;
    scheduling_start_hour?: number;
    payment_deadline?: string;
    created_at?: string;
    extra_prices?: TournamentExtraPriceResponse[];
}

export interface TournamentRequest {
    name: string;
    description?: string;
    location?: string;
    start_date?: string;
    end_date?: string;
    max_teams?: number;
    enrollment_price?: number;
    status?: string;
    type?: string;
    fair_play_enabled?: boolean;
    allow_late_payment?: boolean;
    advancing_count?: number;
    yellow_card_threshold?: number;
    scheduling_day?: number;
    scheduling_start_hour?: number;
    payment_deadline?: string;
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
