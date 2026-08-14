import { UserResponse } from './user.interface';

export interface SimpleRelation {
    id: number;
    name: string;
}

export interface TeamResponse {
    id: number;
    name: string;
    manager_id?: number;
    tournament_id?: number;
    created_at?: string;
    updated_at?: string;
    manager?: UserResponse;
    tournament?: SimpleRelation;
    players?: PlayerResponse[];
}

export interface TeamRequest {
    name: string;
    tournament_id?: number | null;
    manager_id?: number;
}

export interface PlayerResponse {
    id: number;
    name: string;
    team_id: number;
    number: number;
    created_at?: string;
}

export interface PlayerRequest {
    name: string;
    number: number;
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
