import { Routes } from '@angular/router';

/**
 * Management console routes. Every entry declares the roles allowed to reach it;
 * `authChildGuard` in app.routes.ts enforces them, and app.menu.ts hides what the
 * current role cannot open.
 */
const MANAGEMENT: Routes = [
    // --- Tournaments ---
    {
        path: 'tournaments',
        loadComponent: () => import('./tournaments/tournaments').then((m) => m.Tournaments),
        data: { roles: ['staff', 'admin'] }
    },
    {
        path: 'tournaments/new',
        loadComponent: () => import('./tournaments/management/management').then((m) => m.TournamentManagement),
        data: { roles: ['staff', 'admin'] }
    },
    {
        path: 'tournaments/edit/:id',
        loadComponent: () => import('./tournaments/management/management').then((m) => m.TournamentManagement),
        data: { roles: ['staff', 'admin'] }
    },
    {
        path: 'tournaments/:id/groups',
        loadComponent: () => import('./tournaments/groups/groups').then((m) => m.TournamentGroups),
        data: { roles: ['staff', 'admin'] }
    },
    {
        path: 'tournaments/:id/schedule',
        loadComponent: () => import('./tournaments/schedule/schedule').then((m) => m.TournamentSchedule),
        data: { roles: ['staff', 'admin'] }
    },
    {
        path: 'tournaments/:id/standings',
        loadComponent: () => import('./tournaments/standings/standings').then((m) => m.TournamentStandings),
        data: { roles: ['manager', 'staff', 'admin'] }
    },

    // --- Clubs and teams ---
    {
        path: 'clubs',
        loadComponent: () => import('./clubs/clubs').then((m) => m.Clubs),
        data: { roles: ['manager', 'staff', 'admin'] }
    },
    {
        path: 'clubs/:id/players',
        loadComponent: () => import('./clubs/pool/pool').then((m) => m.ClubPool),
        data: { roles: ['manager', 'staff', 'admin'] }
    },
    {
        path: 'teams',
        loadComponent: () => import('./teams/teams').then((m) => m.Teams),
        data: { roles: ['manager', 'staff', 'admin'] }
    },
    {
        path: 'teams/new',
        loadComponent: () => import('./teams/management/management').then((m) => m.TeamManagement),
        data: { roles: ['manager', 'staff', 'admin'] }
    },
    {
        path: 'teams/edit/:id',
        loadComponent: () => import('./teams/management/management').then((m) => m.TeamManagement),
        data: { roles: ['manager', 'staff', 'admin'] }
    },
    {
        path: 'teams/:id/players',
        loadComponent: () => import('./teams/players/players').then((m) => m.Players),
        data: { roles: ['manager', 'staff', 'admin'] }
    },

    // --- Matches ---
    {
        path: 'matches',
        loadComponent: () => import('./matches/matches').then((m) => m.Matches),
        data: { roles: ['manager', 'staff', 'admin'] }
    },
    {
        path: 'matches/:id',
        loadComponent: () => import('./matches/console/console').then((m) => m.MatchConsole),
        data: { roles: ['manager', 'staff', 'admin'] }
    },

    // --- Operations ---
    {
        path: 'fields',
        loadComponent: () => import('./fields/fields').then((m) => m.Fields),
        data: { roles: ['staff', 'admin'] }
    },
    {
        path: 'waivers',
        loadComponent: () => import('./waivers/waivers').then((m) => m.Waivers),
        data: { roles: ['manager', 'staff', 'admin'] }
    },
    {
        path: 'suspensions',
        loadComponent: () => import('./suspensions/suspensions').then((m) => m.Suspensions),
        data: { roles: ['staff', 'admin'] }
    },
    {
        path: 'payments',
        loadComponent: () => import('./payments/payments').then((m) => m.Payments),
        data: { roles: ['manager', 'staff', 'admin'] }
    },
    {
        path: 'payments/monitoring',
        loadComponent: () => import('./payments/monitoring/monitoring').then((m) => m.PaymentMonitoring),
        data: { roles: ['staff', 'admin'] }
    },

    // --- Administration ---
    {
        path: 'users',
        loadComponent: () => import('./users/users').then((m) => m.Users),
        data: { roles: ['staff', 'admin'] }
    },
    {
        path: 'profile',
        loadComponent: () => import('./profile/profile').then((m) => m.Profile)
    },
    {
        path: 'settings',
        loadComponent: () => import('./settings/settings').then((m) => m.Settings),
        data: { roles: ['admin'] }
    },
    {
        path: 'audit',
        loadComponent: () => import('./audit/audit').then((m) => m.AuditLogs),
        data: { roles: ['admin'] }
    },

    { path: '**', redirectTo: '/notfound' }
];

export default MANAGEMENT;
