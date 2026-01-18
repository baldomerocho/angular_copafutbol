import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FluidModule } from 'primeng/fluid';
import { CardModule } from 'primeng/card';
import { PasswordModule } from 'primeng/password';
import { UserService } from '../service/user.service';
import { UserResponse, UserUpdateProfileRequest, UserUpdatePasswordRequest } from '../service/interfaces/user.interface';
import { AuthService } from '../service/auth.service';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        InputTextModule,
        ToastModule,
        FluidModule,
        CardModule,
        PasswordModule
    ],
    providers: [MessageService],
    templateUrl: './profile.html'
})
export class Profile implements OnInit {
    user: UserResponse = { id: 0, name: '', email: '', role: '' };
    profileData: UserUpdateProfileRequest = { name: '', email: '' };
    passwordData: UserUpdatePasswordRequest = { password: '' };
    confirmPassword: string = '';
    loadingProfile: boolean = false;
    loadingPassword: boolean = false;

    constructor(
        private userService: UserService,
        private authService: AuthService,
        private messageService: MessageService
    ) { }

    ngOnInit() {
        this.loadProfile();
    }

    loadProfile() {
        this.userService.getProfile().subscribe({
            next: (res) => {
                if (res.data) {
                    this.user = res.data;
                    this.profileData = {
                        name: this.user.name,
                        email: this.user.email
                    };
                }
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el perfil' });
            }
        });
    }

    onUpdateProfile() {
        if (!this.profileData.name?.trim() || !this.profileData.email?.trim()) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Por favor complete todos los campos de perfil' });
            return;
        }

        this.loadingProfile = true;
        this.userService.updateProfile(this.profileData).subscribe({
            next: (res) => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Perfil actualizado correctamente' });
                this.loadingProfile = false;
                if (res.data) {
                    this.user = res.data;
                }
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al actualizar perfil' });
                this.loadingProfile = false;
            }
        });
    }

    onUpdatePassword() {
        if (!this.passwordData.password?.trim()) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'La contraseña no puede estar vacía' });
            return;
        }

        if (this.passwordData.password !== this.confirmPassword) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Las contraseñas no coinciden' });
            return;
        }

        this.loadingPassword = true;
        this.userService.updatePassword(this.passwordData).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Contraseña actualizada correctamente' });
                this.passwordData.password = '';
                this.confirmPassword = '';
                this.loadingPassword = false;
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al actualizar contraseña' });
                this.loadingPassword = false;
            }
        });
    }
}
