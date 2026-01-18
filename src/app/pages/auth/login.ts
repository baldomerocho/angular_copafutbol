import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../service/auth.service';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ButtonModule, CheckboxModule, InputTextModule, PasswordModule, FormsModule, RouterModule, RippleModule, AppFloatingConfigurator, ToastModule, CommonModule],
    template: `
        <p-toast></p-toast>
        <app-floating-configurator />
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
            <div class="flex flex-col items-center justify-center">
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                        <div class="text-center mb-8">
                            <i class="pi pi-briefcase text-primary text-5xl mb-4"></i>
                            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Copa Futbol</div>
                            <span class="text-muted-color font-medium">Inicia sesión para continuar</span>
                        </div>

                        <div>
                            <label for="email" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Email</label>
                            <input pInputText id="email" type="text" placeholder="Correo electrónico" class="w-full mb-8" [(ngModel)]="email" />

                            <label for="password" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Contraseña</label>
                            <p-password id="password" [(ngModel)]="password" placeholder="Contraseña" [toggleMask]="true" styleClass="mb-4" [fluid]="true" [feedback]="false"></p-password>

                            <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                                <div class="flex items-center">
                                    <p-checkbox [(ngModel)]="rememberMe" id="rememberme" binary class="mr-2"></p-checkbox>
                                    <label for="rememberme">Recordarme</label>
                                </div>
                                <a class="font-medium no-underline ml-2 text-right cursor-pointer text-primary">¿Olvidaste tu contraseña?</a>
                            </div>
                            <p-button label="Ingresar" styleClass="w-full" (onClick)="onLogin()" [loading]="loading"></p-button>
                            
                            <div class="mt-6 text-center">
                                <span class="text-muted-color">¿No tienes cuenta? </span>
                                <a routerLink="/auth/register" class="font-medium no-underline cursor-pointer text-primary">Regístrate aquí</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        :host ::ng-deep .pi-briefcase {
            font-size: 4rem;
        }
    `]
})
export class Login {
    email: string = '';
    password: string = '';
    rememberMe: boolean = false;
    loading: boolean = false;
    returnUrl: string = '/';

    constructor(
        private authService: AuthService,
        private router: Router,
        private route: ActivatedRoute,
        private messageService: MessageService
    ) { }

    ngOnInit() {
        this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    }

    onLogin() {
        if (!this.email || !this.password) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Por favor complete todos los campos' });
            return;
        }

        this.loading = true;
        this.authService.login({ email: this.email, password: this.password }).subscribe({
            next: (res) => {
                this.loading = false;
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Bienvenido a Copa Futbol' });
                setTimeout(() => {
                    this.router.navigateByUrl(this.returnUrl);
                }, 1000);
            },
            error: (err) => {
                this.loading = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al iniciar sesión' });
            }
        });
    }
}
