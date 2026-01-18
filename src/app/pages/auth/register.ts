import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { AuthService } from '../service/auth.service';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [ButtonModule, InputTextModule, PasswordModule, FormsModule, RouterModule, RippleModule, AppFloatingConfigurator, ToastModule, CommonModule, SelectModule],
    template: `
        <p-toast></p-toast>
        <app-floating-configurator />
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
            <div class="flex flex-col items-center justify-center">
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                        <div class="text-center mb-8">
                            <i class="pi pi-user-plus text-primary text-5xl mb-4"></i>
                            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Copa Futbol</div>
                            <span class="text-muted-color font-medium">Crea tu cuenta para empezar</span>
                        </div>

                        <div>
                            <label for="name" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Nombre Completo</label>
                            <input pInputText id="name" type="text" placeholder="Tu nombre" class="w-full mb-4" [(ngModel)]="name" />

                            <label for="email" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Email</label>
                            <input pInputText id="email" type="text" placeholder="Correo electrónico" class="w-full mb-4" [(ngModel)]="email" />

                            <label for="role" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Perfil</label>
                            <p-select [options]="roles" [(ngModel)]="selectedRole" optionLabel="label" optionValue="value" class="w-full mb-4" styleClass="w-full" placeholder="Selecciona un perfil"></p-select>

                            <label for="password" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Contraseña</label>
                            <p-password id="password" [(ngModel)]="password" placeholder="Contraseña" [toggleMask]="true" styleClass="mb-8" [fluid]="true" [feedback]="true" promptLabel="Elige una contraseña" weakLabel="Débil" mediumLabel="Media" strongLabel="Fuerte"></p-password>

                            <p-button label="Registrarse" styleClass="w-full" (onClick)="onRegister()" [loading]="loading"></p-button>
                            
                            <div class="mt-6 text-center">
                                <span class="text-muted-color">¿Ya tienes cuenta? </span>
                                <a routerLink="/auth/login" class="font-medium no-underline cursor-pointer text-primary">Inicia sesión</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        :host ::ng-deep .pi-user-plus {
            font-size: 4rem;
        }
    `]
})
export class Register {
    name: string = '';
    email: string = '';
    password: string = '';
    selectedRole: string = 'manager';
    loading: boolean = false;

    roles = [
        { label: 'Administrador de Equipo (Manager)', value: 'manager' },
        { label: 'Organizador (Staff)', value: 'staff' }
    ];

    constructor(
        private authService: AuthService,
        private router: Router,
        private messageService: MessageService
    ) { }

    onRegister() {
        if (!this.name || !this.email || !this.password || !this.selectedRole) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Por favor complete todos los campos' });
            return;
        }

        this.loading = true;
        const userData = {
            name: this.name,
            email: this.email,
            password: this.password,
            role: this.selectedRole
        };

        this.authService.register(userData).subscribe({
            next: (res) => {
                this.loading = false;
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cuenta creada correctamente. Ahora puedes iniciar sesión.' });
                setTimeout(() => {
                    this.router.navigate(['/auth/login']);
                }, 1500);
            },
            error: (err) => {
                this.loading = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al crear la cuenta' });
            }
        });
    }
}
