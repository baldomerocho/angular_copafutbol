import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { AuthService } from '../service/auth.service';

/** Shown when a signed-in user opens a screen their role cannot reach. */
@Component({
    selector: 'app-access',
    standalone: true,
    imports: [RouterModule, ButtonModule, AppFloatingConfigurator],
    template: `
        <app-floating-configurator />
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
            <div class="flex flex-col items-center justify-center px-4">
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-16 px-8 sm:px-20 flex flex-col items-center" style="border-radius: 53px">
                        <div class="flex justify-center items-center border-2 border-primary rounded-full mb-6" style="width: 3.5rem; height: 3.5rem">
                            <i class="pi pi-lock text-primary text-2xl"></i>
                        </div>
                        <h1 class="text-surface-900 dark:text-surface-0 font-bold text-3xl mb-2 text-center">Acceso restringido</h1>
                        <span class="text-muted-color mb-8 text-center max-w-md">
                            Tu perfil ({{ roleLabel() }}) no tiene permiso para abrir esta sección.
                            Si crees que es un error, pídele acceso al administrador del torneo.
                        </span>
                        <div class="flex gap-3">
                            <p-button label="Ir al panel" routerLink="/" />
                            <p-button label="Cerrar sesión" [outlined]="true" (onClick)="logout()" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class Access {
    private readonly authService = inject(AuthService);

    roleLabel(): string {
        const labels: Record<string, string> = {
            admin: 'administrador',
            staff: 'staff',
            manager: 'delegado de equipo'
        };
        return labels[this.authService.getUserRole() ?? ''] ?? 'sin rol';
    }

    logout() {
        this.authService.logout();
        window.location.href = '/auth/login';
    }
}
