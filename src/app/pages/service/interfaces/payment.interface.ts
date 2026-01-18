export interface SimpleRelation {
    id: number;
    name: string;
}

export interface PaymentResponse {
    id: number;
    amount: number;
    created_at: string;
    external_id: string;
    manager_id: number;
    status: string;
    team: SimpleRelation;
    team_id: number;
    tournament: SimpleRelation;
    tournament_id: number;
    type: string;
    match_event_id?: number;
}

export interface PaymentRequest {
    amount: number;
    team_id: number;
    tournament_id: number;
    type: string;
    external_id?: string;
    match_event_id?: number;
}

// Keeping it for backward compatibility or general use if needed, but Response/Request are preferred
export interface Payment extends PaymentResponse { }
