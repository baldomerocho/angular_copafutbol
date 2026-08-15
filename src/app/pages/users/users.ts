import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { FluidModule } from 'primeng/fluid';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../service/auth.service';
import { CatalogService } from '../service/catalog.service';
import { UserCreateRequest, UserResponse, UserUpdateRequest } from '../service/interfaces/user.interface';
import { UserService } from '../service/user.service';
import { ServerTable } from '../shared/server-table';
import { roleSeverity } from '../shared/status';

@Component({
    selector: 'app-users',
    standalone: true,
    imports: [
        CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, DialogModule, ToastModule,
        ToolbarModule, ConfirmDialogModule, FluidModule, SelectModule, TagModule, IconFieldModule,
        InputIconModule, PasswordModule, TooltipModule, MessageModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-confirmdialog [style]="{ width: '440px' }" />

        <div class="card">
            <p-toolbar styleClass="mb-4">
                <ng-template pTemplate="start">
                    <div>
                        <h1 class="text-xl font-semibold m-0">{{ title() }}</h1>
                        <p class="text-muted-color text-sm mt-1 mb-0">{{ subtitle() }}</p>
                    </div>
                </ng-template>
                <ng-template pTemplate="end">
                    <p-button label="Nuevo usuario" icon="pi pi-plus" (onClick)="openNew()" />
                </ng-template>
            </p-toolbar>

            <p-iconfield class="mb-4 block max-w-md">
                <p-inputicon class="pi pi-search" />
                <input pInputText type="text" placeholder="Buscar por nombre o correo" class="w-full"
                       (input)="table.setSearch($any($event.target).value)" />
            </p-iconfield>

            <p-table [value]="table.rows()" [lazy]="true" (onLazyLoad)="table.onLazyLoad($event)"
                     [paginator]="true" [rows]="table.perPage" [totalRecords]="table.total()" [first]="table.first"
                     [rowsPerPageOptions]="[15, 30, 60]" [loading]="table.loading()"
                     currentPageReportTemplate="{first} - {last} de {totalRecords}" [showCurrentPageReport]="true"
                     responsiveLayout="scroll" dataKey="id">
                <ng-template pTemplate="header">
                    <tr>
                        <th>Nombre</th>
                        <th>Correo</th>
                        <th>Perfil</th>
                        <th style="width: 8rem">Acciones</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-user>
                    <tr>
                        <td class="font-medium">{{ user.name }}</td>
                        <td class="text-muted-color">{{ user.email }}</td>
                        <td><p-tag [value]="roleLabel(user.role)" [severity]="roleTone(user.role)" /></td>
                        <td>
                            <div class="flex gap-1">
                                <p-button icon="pi pi-pencil" [rounded]="true" [text]="true"
                                          pTooltip="Editar" tooltipPosition="top" (onClick)="openEdit(user)" />
                                <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger"
                                          pTooltip="Eliminar" tooltipPosition="top"
                                          [disabled]="user.id === currentUserId()" (onClick)="remove(user)" />
                            </div>
                        </td>
                    </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="4">
                            <div class="text-center py-10">
                                <i class="pi pi-users text-4xl text-muted-color mb-3 block"></i>
                                <div class="text-muted-color">Sin usuarios que mostrar.</div>
                            </div>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <p-dialog [(visible)]="userDialog" [style]="{ width: '480px' }" [modal]="true"
                  [header]="editing ? 'Editar usuario' : 'Nuevo usuario'">
            <p-fluid>
                <div class="flex flex-col gap-4">
                    <div class="flex flex-col gap-2">
                        <label class="font-medium">Nombre <span class="text-red-500">*</span></label>
                        <input pInputText [(ngModel)]="form.name" placeholder="Nombre y apellido" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label class="font-medium">Correo <span class="text-red-500">*</span></label>
                        <input pInputText type="email" [(ngModel)]="form.email" placeholder="persona@correo.com" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label class="font-medium">
                            Contraseña @if (!editing) { <span class="text-red-500">*</span> }
                        </label>
                        <p-password [(ngModel)]="form.password" [toggleMask]="true" [feedback]="!editing"
                                    [placeholder]="editing ? 'Dejar vacío para no cambiarla' : 'Mínimo 6 caracteres'"
                                    promptLabel="Escribe una contraseña" weakLabel="Débil" mediumLabel="Media" strongLabel="Fuerte" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label class="font-medium">Perfil</label>
                        <p-select [options]="roleOptions()" [(ngModel)]="form.role" optionLabel="name"
                                  optionValue="id" appendTo="body" [disabled]="!isAdmin()" />
                        @if (!isAdmin()) {
                            <small class="text-muted-color">Como staff, solo puedes gestionar delegados de equipo.</small>
                        }
                    </div>
                </div>
            </p-fluid>

            <ng-template pTemplate="footer">
                <p-button label="Cancelar" [text]="true" (onClick)="userDialog = false" />
                <p-button label="Guardar" icon="pi pi-check" [loading]="working()" (onClick)="save()" />
            </ng-template>
        </p-dialog>
    `
})
export class Users implements OnInit {
    private readonly userService = inject(UserService);
    private readonly catalogService = inject(CatalogService);
    private readonly authService = inject(AuthService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    readonly working = signal(false);

    readonly table: ServerTable<UserResponse> = new ServerTable<UserResponse>((paging) =>
        this.userService.getUsers({ ...paging, search: this.table.search || undefined })
    );

    userDialog = false;
    editing = false;
    editingId?: number;
    form: UserCreateRequest = { name: '', email: '', password: '', role: 'manager' };

    ngOnInit() {
        // The lazy table loads the first page itself.
    }

    isAdmin(): boolean {
        return this.authService.getUserRole() === 'admin';
    }

    currentUserId(): number | null {
        return this.authService.getUserId();
    }

    title(): string {
        return this.isAdmin() ? 'Usuarios' : 'Delegados de equipo';
    }

    subtitle(): string {
        return this.isAdmin()
            ? 'Administradores, staff y delegados de la plataforma.'
            : 'Como staff puedes crear y editar delegados de equipo.';
    }

    /** Staff may only ever produce managers, so the picker hides the rest. */
    roleOptions() {
        const all = this.catalogService.get('user_roles');
        return this.isAdmin() ? all : all.filter((role) => role.id === 'manager');
    }

    roleLabel(role: string) {
        return this.catalogService.label('user_roles', role);
    }

    roleTone(role: string) {
        return roleSeverity(role);
    }

    openNew() {
        this.editing = false;
        this.editingId = undefined;
        this.form = { name: '', email: '', password: '', role: 'manager' };
        this.userDialog = true;
    }

    openEdit(user: UserResponse) {
        this.editing = true;
        this.editingId = user.id;
        this.form = { name: user.name, email: user.email, password: '', role: user.role };
        this.userDialog = true;
    }

    save() {
        if (!this.form.name.trim() || !this.form.email.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Faltan datos', detail: 'Nombre y correo son obligatorios.' });
            return;
        }
        if (!this.editing && this.form.password.length < 6) {
            this.messageService.add({ severity: 'warn', summary: 'Contraseña corta', detail: 'Usa al menos 6 caracteres.' });
            return;
        }

        this.working.set(true);

        if (this.editing && this.editingId) {
            const payload: UserUpdateRequest = {
                name: this.form.name.trim(),
                email: this.form.email.trim(),
                role: this.form.role
            };
            if (this.form.password) payload.password = this.form.password;

            this.userService.updateUser(this.editingId, payload).subscribe({
                next: () => this.onSaved('Usuario actualizado.'),
                error: (err) => this.onError(err)
            });
            return;
        }

        this.userService.createUser({ ...this.form, name: this.form.name.trim(), email: this.form.email.trim() }).subscribe({
            next: () => this.onSaved('Usuario creado.'),
            error: (err) => this.onError(err)
        });
    }

    private onSaved(detail: string) {
        this.working.set(false);
        this.userDialog = false;
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail });
        this.table.refresh();
    }

    private onError(err: { error?: { message?: string } }) {
        this.working.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? 'No se pudo guardar el usuario.' });
    }

    remove(user: UserResponse) {
        this.confirmationService.confirm({
            header: 'Eliminar usuario',
            message: `¿Eliminar la cuenta de ${user.name}?`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.userService.deleteUser(user.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Usuario eliminado.' });
                        this.table.refreshAfterDelete();
                    },
                    error: (err) =>
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? 'No se pudo eliminar.' })
                });
            }
        });
    }
}
