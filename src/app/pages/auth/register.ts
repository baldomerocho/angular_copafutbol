import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { AuthService } from '../service/auth.service';
import { ConfigService } from '../service/config.service';

/**
 * Public sign-up. It creates a team manager and nothing else — the role is decided
 * by the API, not by this form. Staff and admin accounts are created from the user
 * management screen by someone already authorized.
 */
@Component({
    selector: 'app-register',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        ButtonModule,
        InputTextModule,
        PasswordModule,
        RippleModule,
        ToastModule,
        MessageModule,
        AppFloatingConfigurator
    ],
    providers: [MessageService],
    template: `
        <app-floating-configurator />
        <p-toast />

        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
            <div class="flex flex-col items-center justify-center w-full px-4">
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-16 px-6 sm:px-16" style="border-radius: 53px">
                        <div class="text-center mb-8">
                            <i class="pi pi-users text-primary text-5xl mb-4 block"></i>
                            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-2">Crea tu cuenta</div>
                            <span class="text-muted-color font-medium">Registra tu equipo en {{ platformName() }}</span>
                        </div>

                        <div class="w-full md:w-[30rem] flex flex-col gap-4">
                            <div class="flex flex-col gap-2">
                                <label for="name" class="text-surface-900 dark:text-surface-0 font-medium">Nombre completo</label>
                                <input pInputText id="name" type="text" placeholder="Tu nombre" [(ngModel)]="name" autocomplete="name" />
                            </div>

                            <div class="flex flex-col gap-2">
                                <label for="email" class="text-surface-900 dark:text-surface-0 font-medium">Correo electrónico</label>
                                <input pInputText id="email" type="email" placeholder="tu@correo.com" [(ngModel)]="email" autocomplete="email" />
                            </div>

                            <div class="flex flex-col gap-2">
                                <label for="password" class="text-surface-900 dark:text-surface-0 font-medium">Contraseña</label>
                                <p-password id="password" [(ngModel)]="password" placeholder="Mínimo 6 caracteres"
                                            [toggleMask]="true" [feedback]="true" styleClass="w-full" [fluid]="true"
                                            promptLabel="Escribe una contraseña" weakLabel="Débil" mediumLabel="Media" strongLabel="Fuerte" />
                            </div>

                            <p-message severity="secondary" icon="pi pi-info-circle" styleClass="w-full">
                                Tu cuenta se crea como delegado de equipo. Si necesitas permisos de staff, pídelos al administrador.
                            </p-message>

                            <p-button label="Crear cuenta" styleClass="w-full mt-2" [loading]="loading()" (onClick)="onRegister()" />

                            <div class="text-center text-muted-color mt-2">
                                ¿Ya tienes cuenta?
                                <a routerLink="/auth/login" class="font-medium text-primary cursor-pointer ml-1">Inicia sesión</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class Register {
    private readonly authService = inject(AuthService);
    private readonly configService = inject(ConfigService);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);

    name = '';
    email = '';
    password = '';
    readonly loading = signal(false);

    platformName(): string {
        return this.configService.platformName();
    }

    onRegister() {
        if (!this.name.trim() || !this.email.trim() || !this.password) {
            this.messageService.add({ severity: 'warn', summary: 'Faltan datos', detail: 'Completa nombre, correo y contraseña.' });
            return;
        }
        if (this.password.length < 6) {
            this.messageService.add({ severity: 'warn', summary: 'Contraseña corta', detail: 'Usa al menos 6 caracteres.' });
            return;
        }

        this.loading.set(true);
        this.authService.register({ name: this.name.trim(), email: this.email.trim(), password: this.password }).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Cuenta creada', detail: 'Ya puedes iniciar sesión.' });
                setTimeout(() => this.router.navigate(['/auth/login']), 1200);
            },
            error: (err) => {
                this.loading.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'No se pudo crear la cuenta',
                    detail: err.error?.message ?? 'Revisa los datos e inténtalo de nuevo.'
                });
            }
        });
    }
}
