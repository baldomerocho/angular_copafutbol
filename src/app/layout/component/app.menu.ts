import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';

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

    ngOnInit() {
        this.model = [
            {
                label: 'Principal',
                items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] }]
            },
            {
                label: 'Gestión de Torneo',
                items: [
                    { label: 'Torneos', icon: 'pi pi-fw pi-trophy', routerLink: ['/pages/tournaments'] },
                    { label: 'Equipos', icon: 'pi pi-fw pi-users', routerLink: ['/pages/teams'] },
                    { label: 'Partidos', icon: 'pi pi-fw pi-calendar', routerLink: ['/pages/matches'] },
                    { label: 'Sedes/Campos', icon: 'pi pi-fw pi-map-marker', routerLink: ['/pages/fields'] }
                ]
            },
            {
                label: 'Administración',
                items: [
                    { label: 'Pagos', icon: 'pi pi-fw pi-money-bill', routerLink: ['/pages/payments'] },
                    { label: 'Usuarios', icon: 'pi pi-fw pi-user', routerLink: ['/pages/users'] },
                    { label: 'Configuración', icon: 'pi pi-fw pi-cog', routerLink: ['/pages/settings'] }
                ]
            },
            {
                label: 'Utilidades UI',
                items: [
                    { label: 'Componentes', icon: 'pi pi-fw pi-palette', routerLink: ['/uikit/formlayout'] },
                    { label: 'Documentación', icon: 'pi pi-fw pi-book', routerLink: ['/documentation'] }
                ]
            }
        ];
    }
}
