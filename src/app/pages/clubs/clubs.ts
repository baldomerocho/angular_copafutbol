import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../service/auth.service';
import { ClubService } from '../service/club.service';
import { ClubRequest, ClubResponse } from '../service/interfaces/team.interface';
import { UserResponse } from '../service/interfaces/user.interface';
import { UserService } from '../service/user.service';
import { ServerTable } from '../shared/server-table';

/**
 * Clubs are the institution behind the squads: "Deportivo Central" fields a first
 * division team, a reserve team and an under-17, each of which enrolls separately.
 * Managing the club here is what lets those squads share a name, a crest and a
 * delegate without being the same row.
 */
@Component({
    selector: 'app-clubs',
    standalone: true,
    imports: [
        CommonModule, FormsModule, RouterModule, TableModule, ButtonModule, InputTextModule,
        InputNumberModule, ToastModule, ToolbarModule, ConfirmDialogModule, IconFieldModule,
        InputIconModule, TooltipModule, TagModule, DialogModule, SelectModule, MessageModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-confirmdialog [style]="{ width: '440px' }" />

        <div class="card">
            <p-toolbar styleClass="mb-4">
                <ng-template pTemplate="start">
                    <div>
                        <h1 class="text-xl font-semibold m-0">{{ isManager() ? 'Mis clubes' : 'Clubes' }}</h1>
                        <p class="text-muted-color text-sm mt-1 mb-0">
                            Un club agrupa a sus equipos por división. Primera, reserva y juveniles comparten escudo
                            pero se inscriben por separado.
                        </p>
                    </div>
                </ng-template>
                <ng-template pTemplate="end">
                    <p-button label="Nuevo club" icon="pi pi-plus" (onClick)="openNew()" />
                </ng-template>
            </p-toolbar>

            <p-iconfield class="mb-4 block max-w-md">
                <p-inputicon class="pi pi-search" />
                <input pInputText type="text" placeholder="Buscar club" class="w-full"
                       (input)="table.setSearch($any($event.target).value)" />
            </p-iconfield>

            <p-table [value]="table.rows()" [lazy]="true" (onLazyLoad)="table.onLazyLoad($event)"
                     [paginator]="true" [rows]="table.perPage" [totalRecords]="table.total()" [first]="table.first"
                     [rowsPerPageOptions]="[15, 30, 60]" [loading]="table.loading()"
                     currentPageReportTemplate="{first} - {last} de {totalRecords}" [showCurrentPageReport]="true"
                     responsiveLayout="scroll" dataKey="id">
                <ng-template pTemplate="header">
                    <tr>
                        <th>Club</th>
                        <th>Sede</th>
                        @if (!isManager()) { <th>Delegado</th> }
                        <th>Divisiones</th>
                        <th style="width: 12rem">Acciones</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-club>
                    <tr>
                        <td>
                            <div class="flex items-center gap-3">
                                @if (club.logo_url) {
                                    <img [src]="club.logo_url" [alt]="club.name" class="w-8 h-8 rounded object-cover" />
                                } @else {
                                    <div class="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                        {{ initials(club.name) }}
                                    </div>
                                }
                                <div>
                                    <div class="font-medium">{{ club.name }}</div>
                                    @if (club.founded_in) {
                                        <div class="text-muted-color text-xs">Fundado en {{ club.founded_in }}</div>
                                    }
                                </div>
                            </div>
                        </td>
                        <td class="text-sm text-muted-color">{{ club.location || '—' }}</td>
                        @if (!isManager()) {
                            <td class="text-sm text-muted-color">{{ club.manager?.name || '—' }}</td>
                        }
                        <td>
                            @if (club.teams?.length) {
                                <div class="flex flex-wrap gap-1">
                                    @for (team of club.teams; track team.id) {
                                        <p-tag [value]="team.division || team.name"
                                               [severity]="team.tournament_id ? 'success' : 'secondary'"
                                               styleClass="text-xs"
                                               [pTooltip]="team.tournament?.name || 'Sin inscribir'"
                                               tooltipPosition="top" />
                                    }
                                </div>
                            } @else {
                                <span class="text-muted-color text-sm">Sin equipos</span>
                            }
                        </td>
                        <td>
                            <div class="flex gap-1">
                                <p-button icon="pi pi-id-card" [rounded]="true" [text]="true" severity="secondary"
                                          pTooltip="Plantel del club" tooltipPosition="top"
                                          [routerLink]="['/pages/clubs', club.id, 'players']" />
                                <p-button icon="pi pi-users" [rounded]="true" [text]="true" severity="secondary"
                                          pTooltip="Ver equipos" tooltipPosition="top"
                                          routerLink="/pages/teams" />
                                <p-button icon="pi pi-pencil" [rounded]="true" [text]="true"
                                          pTooltip="Editar" tooltipPosition="top" (onClick)="openEdit(club)" />
                                <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger"
                                          pTooltip="Eliminar" tooltipPosition="top" (onClick)="remove(club)" />
                            </div>
                        </td>
                    </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td [attr.colspan]="isManager() ? 4 : 5">
                            <div class="text-center py-10">
                                <i class="pi pi-building text-4xl text-muted-color mb-3 block"></i>
                                <div class="text-muted-color mb-4">Todavía no hay clubes registrados.</div>
                                <p-button label="Crear club" icon="pi pi-plus" (onClick)="openNew()" />
                            </div>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <p-dialog [(visible)]="dialog" [style]="{ width: '560px' }" [modal]="true"
                  [header]="form.id ? 'Editar club' : 'Nuevo club'">
            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-12 md:col-span-8 flex flex-col gap-2">
                    <label class="font-medium">Nombre <span class="text-red-500">*</span></label>
                    <input pInputText [(ngModel)]="form.name" placeholder="Deportivo Central" class="w-full" />
                </div>
                <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
                    <label class="font-medium">Siglas</label>
                    <input pInputText [(ngModel)]="form.short_name" placeholder="DPC" maxlength="8" class="w-full" />
                </div>

                <div class="col-span-12 md:col-span-8 flex flex-col gap-2">
                    <label class="font-medium">Sede</label>
                    <input pInputText [(ngModel)]="form.location" placeholder="Ciudad de Guatemala" class="w-full" />
                </div>
                <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
                    <label class="font-medium">Fundación</label>
                    <p-inputnumber [(ngModel)]="form.founded_in" [useGrouping]="false" [min]="1850" [max]="2100"
                                   placeholder="1998" class="w-full" />
                </div>

                <div class="col-span-12 flex flex-col gap-2">
                    <label class="font-medium">Escudo (URL)</label>
                    <input pInputText [(ngModel)]="form.logo_url" placeholder="https://..." class="w-full" />
                </div>

                @if (!isManager()) {
                    <div class="col-span-12 flex flex-col gap-2">
                        <label class="font-medium">Delegado</label>
                        <p-select [options]="managers()" [(ngModel)]="form.manager_id" optionLabel="name"
                                  optionValue="id" placeholder="Selecciona un delegado" appendTo="body"
                                  [filter]="true" filterBy="name,email" [showClear]="true" class="w-full" />
                    </div>
                }

                <div class="col-span-12">
                    <p-message severity="secondary" icon="pi pi-info-circle" styleClass="w-full">
                        Después de crear el club, crea un equipo por cada división desde
                        <a routerLink="/pages/teams" class="underline">Equipos</a>.
                    </p-message>
                </div>
            </div>

            <ng-template pTemplate="footer">
                <p-button label="Cancelar" [text]="true" (onClick)="dialog = false" />
                <p-button label="Guardar" icon="pi pi-check" [loading]="working()" (onClick)="save()" />
            </ng-template>
        </p-dialog>
    `
})
export class Clubs implements OnInit {
    private readonly clubService = inject(ClubService);
    private readonly userService = inject(UserService);
    private readonly authService = inject(AuthService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    readonly managers = signal<UserResponse[]>([]);
    readonly working = signal(false);

    readonly table: ServerTable<ClubResponse> = new ServerTable<ClubResponse>((paging) =>
        this.clubService.getClubs({ ...paging, search: this.table.search || undefined })
    );

    dialog = false;
    form: ClubRequest & { id?: number } = { name: '' };

    ngOnInit() {
        // The lazy table loads the first page itself.
        if (!this.isManager()) {
            this.userService
                .getUsers({ role: 'manager' })
                .pipe(catchError(() => of({ data: [] })))
                .subscribe((res) => this.managers.set((res.data ?? []) as UserResponse[]));
        }
    }

    isManager(): boolean {
        return this.authService.isManager();
    }

    /** Fallback crest: the club's initials, up to three letters. */
    initials(name: string): string {
        return (name || '?')
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 3)
            .map((word) => word[0].toUpperCase())
            .join('');
    }

    openNew() {
        this.form = { name: '' };
        this.dialog = true;
    }

    openEdit(club: ClubResponse) {
        this.form = {
            id: club.id,
            name: club.name,
            short_name: club.short_name,
            logo_url: club.logo_url,
            location: club.location,
            founded_in: club.founded_in,
            manager_id: club.manager_id
        };
        this.dialog = true;
    }

    save() {
        if (!this.form.name?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Falta el nombre', detail: 'El club necesita un nombre.' });
            return;
        }

        this.working.set(true);
        const payload: ClubRequest = {
            name: this.form.name.trim(),
            short_name: this.form.short_name?.trim() || undefined,
            logo_url: this.form.logo_url?.trim() || undefined,
            location: this.form.location?.trim() || undefined,
            founded_in: this.form.founded_in || undefined,
            manager_id: this.form.manager_id
        };

        const request = this.form.id
            ? this.clubService.updateClub(this.form.id, payload)
            : this.clubService.createClub(payload);

        request.subscribe({
            next: () => {
                this.working.set(false);
                this.dialog = false;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Guardado',
                    detail: `Club ${this.form.id ? 'actualizado' : 'creado'}.`
                });
                this.table.refresh();
            },
            error: (err) => {
                this.working.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'No se pudo guardar',
                    detail: err.error?.message ?? 'Inténtalo de nuevo.'
                });
            }
        });
    }

    remove(club: ClubResponse) {
        this.confirmationService.confirm({
            header: 'Eliminar club',
            message: `Se eliminará "${club.name}". Sus equipos quedan sin club, no se borran. ¿Continuar?`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.clubService.deleteClub(club.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Club eliminado.' });
                        this.table.refreshAfterDelete();
                    },
                    error: (err) =>
                        this.messageService.add({
                            severity: 'error',
                            summary: 'No se pudo eliminar',
                            detail: err.error?.message ?? 'Inténtalo de nuevo.'
                        })
                });
            }
        });
    }
}
