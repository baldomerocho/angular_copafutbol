import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { FluidModule } from 'primeng/fluid';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { CatalogService } from '../service/catalog.service';
import { UserResponse, UserUpdateProfileRequest } from '../service/interfaces/user.interface';
import { UserService } from '../service/user.service';
import { roleSeverity } from '../shared/status';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, ToastModule, FluidModule, CardModule, PasswordModule, TagModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="grid grid-cols-12 gap-6">
            <div class="col-span-12">
                <h1 class="text-2xl font-semibold m-0">Mi perfil</h1>
                <p class="text-muted-color mt-1 mb-0">Actualiza tus datos y tu contraseña.</p>
            </div>

            <div class="col-span-12 lg:col-span-6">
                <div class="card h-full">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="flex items-center justify-center bg-primary-100 dark:bg-primary-400/10 rounded-full" style="width: 3rem; height: 3rem">
                            <i class="pi pi-user text-primary text-xl"></i>
                        </div>
                        <div>
                            <div class="font-semibold text-lg">{{ user()?.name }}</div>
                            <p-tag [value]="roleLabel()" [severity]="roleTone()" styleClass="text-xs mt-1" />
                        </div>
                    </div>

                    <p-fluid>
                        <div class="flex flex-col gap-4">
                            <div class="flex flex-col gap-2">
                                <label for="name" class="font-medium">Nombre</label>
                                <input pInputText id="name" [(ngModel)]="profileData.name" autocomplete="name" />
                            </div>
                            <div class="flex flex-col gap-2">
                                <label for="email" class="font-medium">Correo electrónico</label>
                                <input pInputText id="email" type="email" [(ngModel)]="profileData.email" autocomplete="email" />
                            </div>
                            <p-button label="Guardar cambios" icon="pi pi-check" [loading]="savingProfile()" (onClick)="onUpdateProfile()" />
                        </div>
                    </p-fluid>
                </div>
            </div>

            <div class="col-span-12 lg:col-span-6">
                <div class="card h-full">
                    <div class="font-semibold text-lg mb-6">Cambiar contraseña</div>

                    <p-fluid>
                        <div class="flex flex-col gap-4">
                            <div class="flex flex-col gap-2">
                                <label for="current" class="font-medium">Contraseña actual</label>
                                <p-password inputId="current" [(ngModel)]="currentPassword" [feedback]="false"
                                            [toggleMask]="true" autocomplete="current-password" />
                            </div>
                            <div class="flex flex-col gap-2">
                                <label for="new" class="font-medium">Nueva contraseña</label>
                                <p-password inputId="new" [(ngModel)]="newPassword" [toggleMask]="true"
                                            autocomplete="new-password"
                                            promptLabel="Escribe una contraseña" weakLabel="Débil" mediumLabel="Media" strongLabel="Fuerte" />
                            </div>
                            <div class="flex flex-col gap-2">
                                <label for="confirm" class="font-medium">Repite la nueva contraseña</label>
                                <p-password inputId="confirm" [(ngModel)]="confirmPassword" [feedback]="false"
                                            [toggleMask]="true" autocomplete="new-password" />
                            </div>
                            <p-button label="Actualizar contraseña" icon="pi pi-lock" severity="secondary"
                                      [loading]="savingPassword()" (onClick)="onUpdatePassword()" />
                        </div>
                    </p-fluid>
                </div>
            </div>
        </div>
    `
})
export class Profile implements OnInit {
    private readonly userService = inject(UserService);
    private readonly catalogService = inject(CatalogService);
    private readonly messageService = inject(MessageService);

    readonly user = signal<UserResponse | null>(null);
    readonly savingProfile = signal(false);
    readonly savingPassword = signal(false);

    profileData: UserUpdateProfileRequest = { name: '', email: '' };
    currentPassword = '';
    newPassword = '';
    confirmPassword = '';

    ngOnInit() {
        this.userService.getProfile().subscribe({
            next: (res) => {
                if (!res.data) return;
                this.user.set(res.data);
                this.profileData = { name: res.data.name, email: res.data.email };
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar tu perfil.' })
        });
    }

    roleLabel(): string {
        return this.catalogService.label('user_roles', this.user()?.role);
    }

    roleTone() {
        return roleSeverity(this.user()?.role);
    }

    onUpdateProfile() {
        if (!this.profileData.name?.trim() || !this.profileData.email?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Faltan datos', detail: 'Nombre y correo son obligatorios.' });
            return;
        }

        this.savingProfile.set(true);
        this.userService.updateProfile(this.profileData).subscribe({
            next: (res) => {
                this.savingProfile.set(false);
                if (res.data) this.user.set(res.data);
                this.messageService.add({ severity: 'success', summary: 'Listo', detail: 'Perfil actualizado.' });
            },
            error: (err) => {
                this.savingProfile.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? 'No se pudo actualizar el perfil.' });
            }
        });
    }

    onUpdatePassword() {
        if (!this.currentPassword || !this.newPassword) {
            this.messageService.add({ severity: 'warn', summary: 'Faltan datos', detail: 'Escribe tu contraseña actual y la nueva.' });
            return;
        }
        if (this.newPassword.length < 6) {
            this.messageService.add({ severity: 'warn', summary: 'Contraseña corta', detail: 'Usa al menos 6 caracteres.' });
            return;
        }
        if (this.newPassword !== this.confirmPassword) {
            this.messageService.add({ severity: 'warn', summary: 'No coinciden', detail: 'La confirmación no coincide con la nueva contraseña.' });
            return;
        }

        this.savingPassword.set(true);
        this.userService
            .updatePassword({ current_password: this.currentPassword, new_password: this.newPassword })
            .subscribe({
                next: () => {
                    this.savingPassword.set(false);
                    this.currentPassword = this.newPassword = this.confirmPassword = '';
                    this.messageService.add({ severity: 'success', summary: 'Listo', detail: 'Contraseña actualizada.' });
                },
                error: (err) => {
                    this.savingPassword.set(false);
                    const detail = err.status === 401
                        ? 'La contraseña actual no es correcta.'
                        : err.error?.message ?? 'No se pudo actualizar la contraseña.';
                    this.messageService.add({ severity: 'error', summary: 'Error', detail });
                }
            });
    }
}
