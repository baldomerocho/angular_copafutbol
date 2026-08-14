export interface AdminDashboardResponse {
    total_tournaments: number;
    total_teams: number;
    total_users: number;
    total_revenue: number;
    pending_payments: number;
    active_matches: number;
}

export interface StaffDashboardResponse {
    active_tournaments: number;
    upcoming_matches: number;
    pending_payments: number;
    recent_events: number;
}

export interface ManagerDashboardResponse {
    my_teams: number;
    total_players: number;
    upcoming_matches: number;
    /** Percentage of the expected amount already approved. */
    payments_status: number;
}

/** The API returns a different shape per role; the UI reads whichever came back. */
export type DashboardStats = Partial<AdminDashboardResponse & StaffDashboardResponse & ManagerDashboardResponse>;

/** One headline number on the dashboard. */
export interface StatTile {
    label: string;
    value: string | number;
    hint: string;
    icon: string;
    tone: 'primary' | 'success' | 'warn' | 'danger' | 'info';
    link?: string;
}
