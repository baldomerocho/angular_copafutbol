import { Routes } from '@angular/router';

/**
 * Public portal: what a player or a fan sees without an account. Every endpoint it
 * uses lives under the API's /public prefix, so no token is ever needed here.
 */
export default [
    {
        path: '',
        loadComponent: () => import('./public-layout').then((m) => m.PublicLayout),
        children: [
            { path: '', loadComponent: () => import('./home/home').then((m) => m.PublicHome) },
            { path: 'torneos/:id', loadComponent: () => import('./tournament/tournament').then((m) => m.PublicTournament) },
            { path: 'partidos/:id', loadComponent: () => import('./match/match').then((m) => m.PublicMatch) },
            { path: '**', redirectTo: '' }
        ]
    }
] as Routes;
