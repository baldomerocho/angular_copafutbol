import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../pages/service/auth.service';
import { ConfigService } from '../pages/service/config.service';
import { LayoutService } from '../layout/service/layout.service';

/** Shell for the unauthenticated portal: light chrome, no side menu. */
@Component({
    selector: 'app-public-layout',
    standalone: true,
    imports: [CommonModule, RouterModule, ButtonModule],
    template: `
        <div class="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col">
            <header class="bg-surface-0 dark:bg-surface-900 border-b border-surface sticky top-0 z-10">
                <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
                    <a routerLink="/publico" class="flex items-center gap-2 no-underline text-surface-900 dark:text-surface-0">
                        @if (config.appConfig()?.logo_url) {
                            <img [src]="config.appConfig()?.logo_url" alt="" style="height: 2rem" />
                        } @else {
                            <i class="pi pi-trophy text-primary text-2xl"></i>
                        }
                        <span class="font-semibold text-lg">{{ config.platformName() }}</span>
                    </a>

                    <div class="flex items-center gap-2">
                        <button type="button" class="layout-topbar-action" (click)="toggleDarkMode()" aria-label="Cambiar tema">
                            <i class="pi" [ngClass]="layout.isDarkTheme() ? 'pi-moon' : 'pi-sun'"></i>
                        </button>
                        @if (auth.isLoggedIn()) {
                            <p-button label="Ir al panel" icon="pi pi-th-large" size="small" routerLink="/" />
                        } @else {
                            <p-button label="Ingresar" icon="pi pi-sign-in" size="small" [outlined]="true" routerLink="/auth/login" />
                        }
                    </div>
                </div>
            </header>

            <main class="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
                <router-outlet />
            </main>

            <footer class="border-t border-surface py-6 mt-8">
                <div class="max-w-6xl mx-auto px-4 flex flex-wrap justify-between gap-3 text-sm text-muted-color">
                    <span>{{ config.platformName() }}</span>
                    @if (config.appConfig()?.contact_email) {
                        <a [href]="'mailto:' + config.appConfig()?.contact_email" class="text-muted-color">
                            {{ config.appConfig()?.contact_email }}
                        </a>
                    }
                </div>
            </footer>
        </div>
    `
})
export class PublicLayout {
    readonly config = inject(ConfigService);
    readonly auth = inject(AuthService);
    readonly layout = inject(LayoutService);

    toggleDarkMode() {
        this.layout.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
    }
}
