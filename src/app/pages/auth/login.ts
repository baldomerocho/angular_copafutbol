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
    templateUrl: './login.html',
    styleUrl: './login.css'
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
