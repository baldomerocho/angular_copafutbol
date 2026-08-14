import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Notfound } from './app/pages/notfound/notfound';
import { authChildGuard, authGuard } from './app/pages/auth/auth.guard';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        canActivate: [authGuard],
        // canActivateChild is what actually enforces the per-route `data.roles`
        // declared on the children; canActivate alone only sees this route's data.
        canActivateChild: [authChildGuard],
        children: [
            { path: '', component: Dashboard },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes') }
        ]
    },
    {
        path: 'publico',
        loadChildren: () => import('./app/public/public.routes')
    },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: 'acceso-denegado', loadComponent: () => import('./app/pages/auth/access').then((m) => m.Access) },
    { path: 'notfound', component: Notfound },
    { path: '**', redirectTo: '/notfound' }
];
