import { TournamentResponse } from "./tournament.interface";
import { UserResponse } from "./user.interface";

export interface TeamResponse {
    id: number;
    name: string;
    manager_id?: number;
    tournament_id?: number;
    created_at?: string;
    manager?: UserResponse;
    tournament?: TournamentResponse;
    players?: PlayerResponse[];
}

export interface TeamRequest {
    name: string;
    tournament_id?: number;
    manager_id?: number;
}

export interface PlayerResponse {
    name: string;
    team_id: number;
    number: number;
    id: number;
}