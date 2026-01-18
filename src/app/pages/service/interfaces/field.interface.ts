export interface FieldResponse {
    id: number;
    name: string;
    location?: string;
    capacity?: number;
    created_at?: string;
}

export interface FieldRequest {
    name: string;
    location?: string;
    capacity?: number;
}
