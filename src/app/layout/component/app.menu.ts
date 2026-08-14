import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../pages/service/auth.service';
import { AppMenuitem } from './app.menuitem';

/** A menu entry plus the roles allowed to see it. */
interface RoleMenuItem extends MenuItem {
    roles?: string[];
    items?: RoleMenuItem[];
}

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        @for (item of model(); track item.label; let i = $index) {
            @if (item.separator) {
                <li class="menu-separator"></li>
            } @else {
                <li app-menuitem [item]="item" [index]="i" [root]="true"></li>
            }
        }
    </ul>`
})
export class AppMenu implements OnInit {
    private readonly authService = inject(AuthService);
    readonly model = signal<MenuItem[]>([]);

    ngOnInit() {
        const sections: RoleMenuItem[] = [
            {
                label: 'Inicio',
                items: [
                    { label: 'Panel', icon: 'pi pi-fw pi-home', routerLink: ['/'] },
                    { label: 'Portal público', icon: 'pi pi-fw pi-globe', routerLink: ['/publico'] }
                ]
            },
            {
                label: 'Competición',
                items: [
                    { label: 'Torneos', icon: 'pi pi-fw pi-trophy', routerLink: ['/pages/tournaments'], roles: ['staff', 'admin'] },
                    { label: 'Equipos', icon: 'pi pi-fw pi-users', routerLink: ['/pages/teams'] },
                    { label: 'Partidos', icon: 'pi pi-fw pi-calendar', routerLink: ['/pages/matches'] },
                    { label: 'Sanciones', icon: 'pi pi-fw pi-ban', routerLink: ['/pages/suspensions'], roles: ['staff', 'admin'] },
                    { label: 'Sedes', icon: 'pi pi-fw pi-map-marker', routerLink: ['/pages/fields'], roles: ['staff', 'admin'] }
                ]
            },
            {
                label: 'Administración',
                items: [
                    { label: 'Pagos', icon: 'pi pi-fw pi-money-bill', routerLink: ['/pages/payments'] },
                    { label: 'Morosidad', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/pages/payments/monitoring'], roles: ['staff', 'admin'] },
                    { label: 'Usuarios', icon: 'pi pi-fw pi-user', routerLink: ['/pages/users'], roles: ['staff', 'admin'] },
                    { label: 'Bitácora', icon: 'pi pi-fw pi-history', routerLink: ['/pages/audit'], roles: ['admin'] },
                    { label: 'Configuración', icon: 'pi pi-fw pi-cog', routerLink: ['/pages/settings'], roles: ['admin'] }
                ]
            },
            {
                label: 'Cuenta',
                items: [{ label: 'Mi perfil', icon: 'pi pi-fw pi-user-edit', routerLink: ['/pages/profile'] }]
            }
        ];

        // Hide what this role cannot open; the route guard still enforces it.
        this.model.set(
            sections
                .map((section) => ({
                    ...section,
                    items: section.items?.filter((item) => !item.roles || this.authService.hasRole(item.roles))
                }))
                .filter((section) => section.items?.length)
        );
    }
}
