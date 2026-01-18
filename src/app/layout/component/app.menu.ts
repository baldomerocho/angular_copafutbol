import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { AuthService } from '../../pages/service/auth.service';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppMenu {
    model: MenuItem[] = [];

    constructor(private authService: AuthService) { }

    ngOnInit() {
        const fullModel: any[] = [
            {
                label: 'Principal',
                items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] }]
            },
            {
                label: 'Gestión de Torneo',
                items: [
                    { label: 'Torneos', icon: 'pi pi-fw pi-trophy', routerLink: ['/pages/tournaments'], roles: ['staff', 'admin'] },
                    { label: 'Equipos', icon: 'pi pi-fw pi-users', routerLink: ['/pages/teams'], roles: ['manager', 'staff', 'admin'] },
                    { label: 'Partidos', icon: 'pi pi-fw pi-calendar', routerLink: ['/pages/matches'], roles: ['staff', 'admin'] },
                    { label: 'Sedes/Campos', icon: 'pi pi-fw pi-map-marker', routerLink: ['/pages/fields'], roles: ['staff', 'admin'] }
                ]
            },
            {
                label: 'Administración',
                items: [
                    { label: 'Pagos', icon: 'pi pi-fw pi-money-bill', routerLink: ['/pages/payments'], roles: ['manager', 'staff', 'admin'] },
                    { label: 'Usuarios / Gerentes', icon: 'pi pi-fw pi-user', routerLink: ['/pages/users'], roles: ['staff', 'admin'] },
                    { label: 'Mi Perfil', icon: 'pi pi-fw pi-user-edit', routerLink: ['/pages/profile'] },
                    { label: 'Configuración', icon: 'pi pi-fw pi-cog', routerLink: ['/pages/settings'], roles: ['admin'] }
                ]
            },
            {
                label: 'Utilidades UI',
                items: [
                    { label: 'Componentes', icon: 'pi pi-fw pi-palette', routerLink: ['/uikit/formlayout'], roles: ['admin'] },
                    { label: 'Documentación', icon: 'pi pi-fw pi-book', routerLink: ['/documentation'], roles: ['admin'] }
                ]
            }
        ];

        this.model = fullModel.map(section => ({
            ...section,
            items: section.items?.filter((item: any) => !item.roles || this.authService.hasRole(item.roles))
        })).filter(section => section.items && section.items.length > 0);
    }
}
