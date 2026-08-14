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
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../service/auth.service';
import { TeamResponse } from '../service/interfaces/team.interface';
import { TournamentResponse } from '../service/interfaces/tournament.interface';
import { TeamService } from '../service/team.service';
import { TournamentService } from '../service/tournament.service';

@Component({
    selector: 'app-teams',
    standalone: true,
    imports: [
        CommonModule, FormsModule, RouterModule, TableModule, ButtonModule, InputTextModule, ToastModule,
        ToolbarModule, ConfirmDialogModule, IconFieldModule, InputIconModule, TooltipModule, TagModule,
        DialogModule, SelectModule, MessageModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-confirmdialog [style]="{ width: '440px' }" />

        <div class="card">
            <p-toolbar styleClass="mb-4">
                <ng-template pTemplate="start">
                    <div>
                        <h1 class="text-xl font-semibold m-0">{{ isManager() ? 'Mis equipos' : 'Equipos' }}</h1>
                        <p class="text-muted-color text-sm mt-1 mb-0">{{ subtitle() }}</p>
                    </div>
                </ng-template>
                <ng-template pTemplate="end">
                    <p-button label="Nuevo equipo" icon="pi pi-plus" routerLink="/pages/teams/new" />
                </ng-template>
            </p-toolbar>

            <p-iconfield class="mb-4 block max-w-md">
                <p-inputicon class="pi pi-search" />
                <input pInputText type="text" placeholder="Buscar equipo" class="w-full"
                       (input)="applySearch($any($event.target).value)" />
            </p-iconfield>

            <p-table [value]="filtered()" [rows]="15" [paginator]="filtered().length > 15"
                     [loading]="loading()" responsiveLayout="scroll" dataKey="id">
                <ng-template pTemplate="header">
                    <tr>
                        <th>Equipo</th>
                        <th>Club</th>
                        @if (!isManager()) { <th>Delegado</th> }
                        <th>Torneo</th>
                        <th class="text-center">Jugadores</th>
                        <th style="width: 14rem">Acciones</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-team>
                    <tr>
                        <td>
                            <div class="font-medium">{{ team.name }}</div>
                            @if (team.division) {
                                <div class="text-muted-color text-xs">{{ team.division }}</div>
                            }
                        </td>
                        <td class="text-sm">
                            @if (team.club?.name) {
                                {{ team.club.name }}
                            } @else {
                                <span class="text-muted-color">Independiente</span>
                            }
                        </td>
                        @if (!isManager()) {
                            <td class="text-sm text-muted-color">{{ team.manager?.name || '—' }}</td>
                        }
                        <td>
                            @if (team.tournament?.name) {
                                <p-tag [value]="team.tournament.name" severity="info" styleClass="text-xs" />
                            } @else {
                                <span class="text-muted-color text-sm">Sin inscribir</span>
                            }
                        </td>
                        <td class="text-center tabular-nums">{{ team.player_count }}</td>
                        <td>
                            <div class="flex gap-1">
                                <p-button icon="pi pi-id-card" [rounded]="true" [text]="true" severity="secondary"
                                          pTooltip="Plantilla" tooltipPosition="top"
                                          [routerLink]="['/pages/teams', team.id, 'players']" />
                                @if (!team.tournament_id) {
                                    <p-button icon="pi pi-sign-in" [rounded]="true" [text]="true" severity="success"
                                              pTooltip="Inscribir en torneo" tooltipPosition="top"
                                              (onClick)="openEnroll(team)" />
                                }
                                <p-button icon="pi pi-pencil" [rounded]="true" [text]="true"
                                          pTooltip="Editar" tooltipPosition="top"
                                          [routerLink]="['/pages/teams/edit', team.id]" />
                                <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger"
                                          pTooltip="Eliminar" tooltipPosition="top" (onClick)="remove(team)" />
                            </div>
                        </td>
                    </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td [attr.colspan]="isManager() ? 5 : 6">
                            <div class="text-center py-10">
                                <i class="pi pi-users text-4xl text-muted-color mb-3 block"></i>
                                <div class="text-muted-color mb-4">Todavía no hay equipos.</div>
                                <p-button label="Crear equipo" icon="pi pi-plus" routerLink="/pages/teams/new" />
                            </div>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <p-dialog [(visible)]="enrollDialog" [style]="{ width: '520px' }" [modal]="true"
                  [header]="'Inscribir ' + (selectedTeam?.name || '')">
            <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-2">
                    <label class="font-medium">Torneo</label>
                    <p-select [options]="openTournaments()" [(ngModel)]="enrollTournamentId" optionLabel="name"
                              optionValue="id" placeholder="Selecciona un torneo" appendTo="body" class="w-full" />
                </div>

                @if (selectedTournament(); as tournament) {
                    <div class="border border-surface rounded-border p-3 text-sm">
                        <div class="flex justify-between py-1">
                            <span class="text-muted-color">Inscripción</span>
                            <span class="tabular-nums">{{ tournament.enrollment_price | currency: 'USD' }}</span>
                        </div>
                        @for (extra of tournament.extra_prices ?? []; track extra.id) {
                            <div class="flex justify-between py-1">
                                <span class="text-muted-color">{{ extra.name }}</span>
                                <span class="tabular-nums">{{ extra.amount | currency: 'USD' }}</span>
                            </div>
                        }
                        <div class="flex justify-between py-1 border-t border-surface mt-1 pt-2 font-semibold">
                            <span>Total</span>
                            <span class="tabular-nums">{{ enrollTotal() | currency: 'USD' }}</span>
                        </div>
                    </div>

                    @if (tournament.allow_late_payment) {
                        <p-message severity="secondary" icon="pi pi-info-circle" styleClass="w-full">
                            Este torneo permite inscribir con pagos pendientes.
                        </p-message>
                    } @else {
                        <p-message severity="warn" icon="pi pi-exclamation-triangle" styleClass="w-full">
                            Necesitas los pagos aprobados antes de inscribir el equipo.
                        </p-message>
                    }
                }
            </div>

            <ng-template pTemplate="footer">
                <p-button label="Cancelar" [text]="true" (onClick)="enrollDialog = false" />
                <p-button label="Inscribir" icon="pi pi-check" [loading]="working()" (onClick)="enroll()" />
            </ng-template>
        </p-dialog>
    `
})
export class Teams implements OnInit {
    private readonly teamService = inject(TeamService);
    private readonly tournamentService = inject(TournamentService);
    private readonly authService = inject(AuthService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    readonly teams = signal<TeamResponse[]>([]);
    readonly filtered = signal<TeamResponse[]>([]);
    readonly tournaments = signal<TournamentResponse[]>([]);
    readonly loading = signal(true);
    readonly working = signal(false);

    enrollDialog = false;
    selectedTeam: TeamResponse | null = null;
    enrollTournamentId?: number;
    private search = '';

    ngOnInit() {
        this.tournamentService.getTournaments().subscribe({
            next: (res) => this.tournaments.set(res.data ?? [])
        });
        this.load();
    }

    isManager(): boolean {
        return this.authService.isManager();
    }

    subtitle(): string {
        return this.isManager()
            ? 'Los equipos que gestionas, su plantilla y su inscripción.'
            : 'Todos los equipos registrados en la plataforma.';
    }

    /** Only tournaments still accepting entries can be picked. */
    openTournaments(): TournamentResponse[] {
        return this.tournaments().filter((t) => t.registration_open && t.status !== 'completed' && t.status !== 'canceled');
    }

    selectedTournament(): TournamentResponse | undefined {
        return this.tournaments().find((t) => t.id === this.enrollTournamentId);
    }

    enrollTotal(): number {
        const tournament = this.selectedTournament();
        if (!tournament) return 0;
        return (tournament.enrollment_price ?? 0) + (tournament.extra_prices ?? []).reduce((sum, e) => sum + e.amount, 0);
    }

    load() {
        this.loading.set(true);
        this.teamService.getTeams().subscribe({
            next: (res) => {
                this.teams.set(res.data ?? []);
                this.applySearch(this.search);
                this.loading.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los equipos.' });
                this.loading.set(false);
            }
        });
    }

    applySearch(term: string) {
        this.search = term ?? '';
        const needle = this.search.trim().toLowerCase();
        this.filtered.set(
            needle
                ? this.teams().filter(
                      (team) =>
                          team.name.toLowerCase().includes(needle) ||
                          (team.club?.name ?? '').toLowerCase().includes(needle) ||
                          (team.division ?? '').toLowerCase().includes(needle)
                  )
                : this.teams()
        );
    }

    openEnroll(team: TeamResponse) {
        this.selectedTeam = team;
        this.enrollTournamentId = this.openTournaments()[0]?.id;
        this.enrollDialog = true;
    }

    enroll() {
        if (!this.selectedTeam || !this.enrollTournamentId) {
            this.messageService.add({ severity: 'warn', summary: 'Falta el torneo', detail: 'Elige un torneo.' });
            return;
        }

        this.working.set(true);
        this.teamService.enroll(this.selectedTeam.id, this.enrollTournamentId).subscribe({
            next: () => {
                this.working.set(false);
                this.enrollDialog = false;
                this.messageService.add({ severity: 'success', summary: 'Inscrito', detail: 'El equipo quedó inscrito en el torneo.' });
                this.load();
            },
            error: (err) => {
                this.working.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'No se pudo inscribir',
                    detail: err.error?.message ?? 'Revisa el estado de los pagos.'
                });
            }
        });
    }

    remove(team: TeamResponse) {
        this.confirmationService.confirm({
            header: 'Eliminar equipo',
            message: `Se eliminará "${team.name}" y su plantilla. ¿Continuar?`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.teamService.deleteTeam(team.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Equipo eliminado.' });
                        this.load();
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
