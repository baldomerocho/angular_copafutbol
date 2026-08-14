/**
 * Severity mapping shared by every table and tag in the app, so a status always
 * reads the same colour wherever it appears.
 */
export type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

export function matchStatusSeverity(status: string | undefined): Severity {
    switch (status) {
        case 'live':
            return 'danger';
        case 'finished':
            return 'success';
        case 'scheduled':
            return 'info';
        case 'rescheduled':
            return 'warn';
        case 'canceled':
            return 'secondary';
        default:
            return 'info';
    }
}

export function paymentStatusSeverity(status: string | undefined): Severity {
    switch (status) {
        case 'approved':
            return 'success';
        case 'pending':
            return 'warn';
        case 'rejected':
        case 'failed':
            return 'danger';
        case 'refunded':
            return 'info';
        case 'notFound':
            return 'secondary';
        default:
            return 'info';
    }
}

export function tournamentStatusSeverity(status: string | undefined): Severity {
    switch (status) {
        case 'ongoing':
            return 'success';
        case 'upcoming':
            return 'info';
        case 'completed':
            return 'secondary';
        case 'canceled':
            return 'danger';
        case 'draft':
            return 'warn';
        default:
            return 'info';
    }
}

export function roleSeverity(role: string | undefined): Severity {
    switch (role) {
        case 'admin':
            return 'danger';
        case 'staff':
            return 'info';
        case 'manager':
            return 'success';
        default:
            return 'secondary';
    }
}

export function eventTypeSeverity(type: string | undefined): Severity {
    switch (type) {
        case 'goal':
            return 'success';
        case 'yellow_card':
            return 'warn';
        case 'red_card':
            return 'danger';
        case 'fine':
            return 'contrast';
        default:
            return 'secondary';
    }
}

export function eventTypeIcon(type: string | undefined): string {
    switch (type) {
        case 'goal':
            return 'pi pi-circle-fill';
        case 'yellow_card':
        case 'red_card':
            return 'pi pi-stop-fill';
        case 'fine':
            return 'pi pi-dollar';
        default:
            return 'pi pi-flag';
    }
}

/** Reads a form string ("WWDLW") into per-result classes for the standings table. */
export function formResultClass(result: string): string {
    switch (result) {
        case 'W':
            return 'bg-green-500 text-white';
        case 'D':
            return 'bg-surface-400 text-white';
        case 'L':
            return 'bg-red-500 text-white';
        default:
            return 'bg-surface-200';
    }
}
