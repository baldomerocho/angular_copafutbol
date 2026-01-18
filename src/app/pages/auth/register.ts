import { Component } from '@angular/core';
import { FluidModule } from 'primeng/fluid';
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
import { CatalogService } from '../service/catalog.service';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [ButtonModule, InputTextModule, PasswordModule, FormsModule, RouterModule, RippleModule, AppFloatingConfigurator, ToastModule, CommonModule, SelectModule, FluidModule],
    templateUrl: './register.html',
    styleUrl: './register.css'
})
export class Register {
    name: string = '';
    email: string = '';
    password: string = '';
    selectedRole: string = 'manager';
    loading: boolean = false;

    constructor(
        private authService: AuthService,
        private catalogService: CatalogService,
        private router: Router,
        private messageService: MessageService
    ) { }

    roles() {
        return this.catalogService.getCatalog('user_roles');
    }

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
