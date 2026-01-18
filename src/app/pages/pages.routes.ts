import { Routes } from '@angular/router';
import { Documentation } from './documentation/documentation';
import { Crud } from './crud/crud';
import { Empty } from './empty/empty';
import { Tournaments } from './tournaments/tournaments';
import { Teams } from './teams/teams';
import { Fields } from './fields/fields';
import { Matches } from './matches/matches';

export default [
    { path: 'documentation', component: Documentation },
    { path: 'crud', component: Crud },
    { path: 'empty', component: Empty },
    { path: 'tournaments', component: Tournaments, data: { roles: ['staff', 'admin'] } },
    { path: 'teams', component: Teams, data: { roles: ['manager', 'staff', 'admin'] } },
    { path: 'fields', component: Fields, data: { roles: ['staff', 'admin'] } },
    { path: 'matches', component: Matches, data: { roles: ['staff', 'admin'] } },
    { path: 'payments', loadComponent: () => import('./payments/payments').then((m) => m.Payments), data: { roles: ['manager', 'staff', 'admin'] } },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
