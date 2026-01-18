export interface Tournament {
    id?: number;
    name: string;
    description?: string;
    location?: string;
    start_date?: string;
    end_date?: string;
    max_teams?: number;
    enrollment_price?: number;
    status?: string;
}
