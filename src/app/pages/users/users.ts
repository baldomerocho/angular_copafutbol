import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { FluidModule } from 'primeng/fluid';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { UserService } from '../service/user.service';
import { CatalogService } from '../service/catalog.service';
import { UserResponse, UserCreateRequest, UserUpdateRequest } from '../service/interfaces/user.interface';
import { AuthService } from '../service/auth.service';

@Component({
    selector: 'app-users',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        DialogModule,
        ToastModule,
        ToolbarModule,
        ConfirmDialogModule,
        FluidModule,
        SelectModule,
        TagModule,
        IconFieldModule,
        InputIconModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './users.html'
})
export class Users implements OnInit {
    users = signal<UserResponse[]>([]);
    user: any = {};
    userDialog: boolean = false;
    loading: boolean = true;
    submitted: boolean = false;
    prefix: string = '';

    @ViewChild('dt') dt!: Table;

    constructor(
        private userService: UserService,
        private catalogService: CatalogService,
        private authService: AuthService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
    ) { }

    ngOnInit() {
        this.prefix = this.authService.getRolePrefix();
        this.loadUsers();
    }

    get title(): string {
        return this.prefix === 'admin' ? 'Gestión de Usuarios' : 'Gestión de Gerentes/Managers';
    }

    roles() {
        return this.catalogService.getCatalog('user_roles');
    }

    loadUsers() {
        this.loading = true;
        this.userService.getUsers().subscribe({
            next: (res) => {
                this.users.set(res.data || []);
                this.loading = false;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los usuarios' });
                this.loading = false;
            }
        });
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.user = { role: this.prefix === 'admin' ? '' : 'manager' };
        this.submitted = false;
        this.userDialog = true;
    }

    editUser(user: UserResponse) {
        this.user = { ...user };
        this.submitted = false;
        this.userDialog = true;
    }

    deleteUser(user: UserResponse) {
        this.confirmationService.confirm({
            message: `¿Está seguro de que desea eliminar a ${user.name}?`,
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.userService.deleteUser(user.id!).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario eliminado' });
                        this.loadUsers();
                    },
                    error: (err) => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al eliminar usuario' });
                    }
                });
            }
        });
    }

    hideDialog() {
        this.userDialog = false;
        this.submitted = false;
    }

    saveUser() {
        this.submitted = true;

        if (this.user.name?.trim() && this.user.email?.trim() && (this.user.id || this.user.password?.trim())) {
            if (this.user.id) {
                const request: UserUpdateRequest = {
                    name: this.user.name,
                    email: this.user.email,
                    role: this.user.role
                };
                if (this.user.password) request.password = this.user.password;

                this.userService.updateUser(this.user.id, request).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario actualizado' });
                        this.loadUsers();
                        this.userDialog = false;
                    },
                    error: (err) => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al actualizar usuario' });
                    }
                });
            } else {
                const request: UserCreateRequest = {
                    name: this.user.name,
                    email: this.user.email,
                    password: this.user.password,
                    role: this.user.role
                };

                this.userService.createUser(request).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario creado' });
                        this.loadUsers();
                        this.userDialog = false;
                    },
                    error: (err) => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al crear usuario' });
                    }
                });
            }
        }
    }

    getRoleSeverity(role: string) {
        switch (role) {
            case 'admin': return 'danger';
            case 'staff': return 'info';
            case 'manager': return 'success';
            default: return 'secondary';
        }
    }

    getRoleLabel(role: string) {
        return this.catalogService.getCatalog('user_roles').find((r: any) => r.id === role)?.name;
    }
}
