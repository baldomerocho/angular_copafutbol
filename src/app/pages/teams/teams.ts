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
import { TournamentFeeResponse, TournamentResponse } from '../service/interfaces/tournament.interface';
import { TeamService } from '../service/team.service';
import { TournamentService } from '../service/tournament.service';
import { ServerTable } from '../shared/server-table';

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
                       (input)="table.setSearch($any($event.target).value)" />
            </p-iconfield>

            <p-table [value]="table.rows()" [lazy]="true" (onLazyLoad)="table.onLazyLoad($event)"
                     [paginator]="true" [rows]="table.perPage" [totalRecords]="table.total()" [first]="table.first"
                     [rowsPerPageOptions]="[15, 30, 60]" [loading]="table.loading()"
                     currentPageReportTemplate="{first} - {last} de {totalRecords}" [showCurrentPageReport]="true"
                     responsiveLayout="scroll" dataKey="id">
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
                            <span class="tabular-nums">{{ money(tournament.enrollment_price ?? 0, tournament) }}</span>
                        </div>
                        @for (fee of mandatoryFees(tournament); track fee.code) {
                            <div class="flex justify-between py-1">
                                <span class="text-muted-color">{{ fee.name }}</span>
                                <span class="tabular-nums">{{ money(fee.amount, tournament) }}</span>
                            </div>
                        }
                        <div class="flex justify-between py-1 border-t border-surface mt-1 pt-2 font-semibold">
                            <span>Total</span>
                            <span class="tabular-nums">{{ money(enrollTotal(), tournament) }}</span>
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


    readonly tournaments = signal<TournamentResponse[]>([]);
    readonly working = signal(false);

    readonly table: ServerTable<TeamResponse> = new ServerTable<TeamResponse>((paging) =>
        this.teamService.getTeams({ ...paging, search: this.table.search || undefined })
    );

    enrollDialog = false;
    selectedTeam: TeamResponse | null = null;
    enrollTournamentId?: number;

    ngOnInit() {
        // Every open tournament has to be in the picker, so this one is not paged.
        this.tournamentService.getTournaments().subscribe({
            next: (res) => this.tournaments.set(res.data ?? [])
        });
        // The lazy table loads the first page itself.
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

    /** Only the mandatory lines are owed to enter; the rest are charged if they apply. */
    mandatoryFees(tournament: TournamentResponse): TournamentFeeResponse[] {
        return (tournament.fees ?? []).filter((fee) => fee.mandatory);
    }

    enrollTotal(): number {
        const tournament = this.selectedTournament();
        if (!tournament) return 0;
        return (
            (tournament.enrollment_price ?? 0) +
            this.mandatoryFees(tournament).reduce((sum, fee) => sum + fee.amount, 0)
        );
    }

    /** Amounts belong to the tournament's own currency, not the platform's. */
    money(amount: number, tournament: TournamentResponse): string {
        return `${tournament.currency ?? ''} ${(amount ?? 0).toFixed(2)}`.trim();
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
                this.table.refresh();
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
