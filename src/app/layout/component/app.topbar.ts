import { Component, OnInit, signal } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '../service/layout.service';
import { AuthService } from '../../pages/service/auth.service';
import { ConfigService } from '../../pages/service/config.service';
import { WaiverService } from '../../pages/service/waiver.service';
import { Router } from '@angular/router';

@Component({
    // ... (skipping template for brevity if possible, but replace_file_content needs the block)
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule, AppConfigurator],
    template: ` <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                <i class="pi pi-bars"></i>
            </button>
            <a class="layout-topbar-logo" routerLink="/">
                <img *ngIf="configService.appConfig()?.logo_url" [src]="configService.appConfig()?.logo_url" alt="Logo" class="mr-2" style="height: 2.5rem;">
                <i *ngIf="!configService.appConfig()?.logo_url" class="pi pi-trophy text-primary text-4xl mr-2"></i>
                <span>{{ configService.appConfig()?.platform_name || 'COPA FUTBOL' }}</span>
            </a>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <button type="button" class="layout-topbar-action" (click)="toggleDarkMode()">
                    <i [ngClass]="{ 'pi ': true, 'pi-moon': layoutService.isDarkTheme(), 'pi-sun': !layoutService.isDarkTheme() }"></i>
                </button>
                <div class="relative">
                    <button
                        class="layout-topbar-action layout-topbar-action-highlight"
                        pStyleClass="@next"
                        enterFromClass="hidden"
                        enterActiveClass="animate-scalein"
                        leaveToClass="hidden"
                        leaveActiveClass="animate-fadeout"
                        [hideOnOutsideClick]="true"
                    >
                        <i class="pi pi-palette"></i>
                    </button>
                    <app-configurator />
                </div>
            </div>

            <button class="layout-topbar-menu-button layout-topbar-action" pStyleClass="@next" enterFromClass="hidden" enterActiveClass="animate-scalein" leaveToClass="hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true">
                <i class="pi pi-ellipsis-v"></i>
            </button>

            <div class="layout-topbar-menu hidden lg:block">
                <div class="layout-topbar-menu-content">
                    <button type="button" class="layout-topbar-action relative" routerLink="/pages/waivers"
                            [title]="pendingTitle()">
                        <i class="pi pi-inbox"></i>
                        <span>Solicitudes</span>
                        @if (pendingWaivers() > 0) {
                            <span class="absolute flex items-center justify-center rounded-full bg-red-500 text-white font-bold"
                                  style="top: -0.15rem; left: 0.9rem; min-width: 1.05rem; height: 1.05rem; font-size: 0.65rem; padding: 0 0.2rem">
                                {{ pendingWaivers() > 9 ? '9+' : pendingWaivers() }}
                            </span>
                        }
                    </button>
                    <button type="button" class="layout-topbar-action" (click)="logout()">
                        <i class="pi pi-sign-out"></i>
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </div>
        </div>
    </div>`
})
export class AppTopbar implements OnInit {
    items!: MenuItem[];

    /**
     * Authorisation requests waiting on someone. The side menu already links to
     * them; what this adds is the count, which is the part you need to notice
     * without going looking. A link that only duplicated the menu would be
     * clutter — that is why the template's dead "Calendar" button is gone rather
     * than pointed at the fixture list.
     */
    readonly pendingWaivers = signal(0);

    constructor(public layoutService: LayoutService, public configService: ConfigService, private authService: AuthService, private router: Router, private waiverService: WaiverService) { }

    ngOnInit() {
        // One row is enough: the count comes from the pagination meta.
        this.waiverService.getWaivers({ status: 'pending', page: 1, per_page: 1 }).subscribe({
            next: (res) => this.pendingWaivers.set(res.meta?.total ?? (res.data ?? []).length),
            error: () => this.pendingWaivers.set(0)
        });
    }

    pendingTitle(): string {
        const count = this.pendingWaivers();
        if (count === 0) return 'Solicitudes de inscripción';
        return count === 1
            ? '1 solicitud esperando resolución'
            : `${count} solicitudes esperando resolución`;
    }

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/auth/login']);
    }
}
