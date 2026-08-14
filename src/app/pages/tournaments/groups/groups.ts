import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PickListModule } from 'primeng/picklist';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToolbarModule } from 'primeng/toolbar';
import { forkJoin } from 'rxjs';
import { TeamResponse } from '../../service/interfaces/team.interface';
import { TournamentGroupResponse, TournamentResponse } from '../../service/interfaces/tournament.interface';
import { TeamService } from '../../service/team.service';
import { TournamentService } from '../../service/tournament.service';

/**
 * Group management. Teams are assigned here, and the calendar generator relies on
 * it: without a group membership a hybrid tournament has nothing to schedule.
 */
@Component({
    selector: 'app-tournament-groups',
    standalone: true,
    imports: [
        CommonModule, FormsModule, RouterModule, ButtonModule, InputTextModule, InputNumberModule,
        DialogModule, ToastModule, ToolbarModule, ConfirmDialogModule, TagModule, PickListModule,
        ToggleSwitchModule, MessageModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-confirmdialog [style]="{ width: '440px' }" />

        <div class="card">
            <p-toolbar styleClass="mb-4">
                <ng-template pTemplate="start">
                    <div>
                        <h1 class="text-xl font-semibold m-0">Grupos · {{ tournament()?.name }}</h1>
                        <p class="text-muted-color text-sm mt-1 mb-0">
                            {{ teams().length }} equipos inscritos · clasifican {{ tournament()?.advancing_count || 0 }} por grupo
                        </p>
                    </div>
                </ng-template>
                <ng-template pTemplate="end">
                    <div class="flex gap-2">
                        <p-button label="Repartir automáticamente" icon="pi pi-sparkles" severity="secondary"
                                  (onClick)="autoDialog = true" />
                        <p-button label="Nuevo grupo" icon="pi pi-plus" (onClick)="openNew()" />
                    </div>
                </ng-template>
            </p-toolbar>

            @if (unassigned().length > 0) {
                <p-message severity="warn" icon="pi pi-exclamation-triangle" styleClass="w-full mb-4">
                    {{ unassigned().length }} equipo(s) sin grupo: {{ unassignedNames() }}
                </p-message>
            }

            @if (loading()) {
                <div class="text-center py-10 text-muted-color"><i class="pi pi-spin pi-spinner text-2xl"></i></div>
            } @else if (groups().length === 0) {
                <div class="text-center py-12">
                    <i class="pi pi-sitemap text-4xl text-muted-color mb-3 block"></i>
                    <div class="text-muted-color mb-4">Este torneo no tiene grupos todavía.</div>
                    <p-button label="Repartir equipos automáticamente" icon="pi pi-sparkles" (onClick)="autoDialog = true" />
                </div>
            } @else {
                <div class="grid grid-cols-12 gap-4">
                    @for (group of groups(); track group.id) {
                        <div class="col-span-12 md:col-span-6 xl:col-span-4">
                            <div class="border border-surface rounded-border p-4 h-full flex flex-col">
                                <div class="flex justify-between items-start mb-3">
                                    <div>
                                        <div class="font-semibold text-lg">{{ group.name }}</div>
                                        <div class="text-muted-color text-sm">{{ group.team_count }} equipos</div>
                                    </div>
                                    <div class="flex gap-1">
                                        <p-button icon="pi pi-users" [rounded]="true" [text]="true" severity="secondary"
                                                  (onClick)="openTeams(group)" />
                                        <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="secondary"
                                                  (onClick)="openEdit(group)" />
                                        <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger"
                                                  (onClick)="remove(group)" />
                                    </div>
                                </div>

                                <ul class="list-none p-0 m-0 flex-1">
                                    @for (team of group.teams; track team.id; let i = $index) {
                                        <li class="flex items-center gap-2 py-2 border-b border-surface last:border-0">
                                            <span class="text-muted-color text-xs tabular-nums w-4">{{ i + 1 }}</span>
                                            <span class="truncate">{{ team.name }}</span>
                                            @if (i < (tournament()?.advancing_count || 0)) {
                                                <i class="pi pi-arrow-up text-green-500 text-xs ml-auto" title="Zona de clasificación"></i>
                                            }
                                        </li>
                                    } @empty {
                                        <li class="text-muted-color text-sm py-3">Sin equipos asignados.</li>
                                    }
                                </ul>
                            </div>
                        </div>
                    }
                </div>
            }
        </div>

        <!-- Crear / renombrar -->
        <p-dialog [(visible)]="groupDialog" [style]="{ width: '420px' }" [modal]="true"
                  [header]="editing ? 'Renombrar grupo' : 'Nuevo grupo'">
            <div class="flex flex-col gap-2">
                <label class="font-medium">Nombre del grupo</label>
                <input pInputText [(ngModel)]="groupName" placeholder="Grupo A" class="w-full" />
            </div>
            <ng-template pTemplate="footer">
                <p-button label="Cancelar" [text]="true" (onClick)="groupDialog = false" />
                <p-button label="Guardar" icon="pi pi-check" (onClick)="saveGroup()" />
            </ng-template>
        </p-dialog>

        <!-- Asignar equipos -->
        <p-dialog [(visible)]="teamsDialog" [style]="{ width: '760px' }" [modal]="true"
                  [header]="'Equipos de ' + (selectedGroup?.name || '')">
            <p-picklist [source]="availableTeams" [target]="groupTeams" sourceHeader="Disponibles"
                        targetHeader="En el grupo" [dragdrop]="true" [responsive]="true"
                        [sourceStyle]="{ height: '18rem' }" [targetStyle]="{ height: '18rem' }" breakpoint="900px">
                <ng-template let-team #item>
                    <div class="flex items-center gap-2">
                        <i class="pi pi-users text-muted-color"></i>
                        <span>{{ team.name }}</span>
                    </div>
                </ng-template>
            </p-picklist>
            <ng-template pTemplate="footer">
                <p-button label="Cancelar" [text]="true" (onClick)="teamsDialog = false" />
                <p-button label="Guardar equipos" icon="pi pi-check" (onClick)="saveTeams()" />
            </ng-template>
        </p-dialog>

        <!-- Reparto automático -->
        <p-dialog [(visible)]="autoDialog" [style]="{ width: '480px' }" [modal]="true" header="Repartir equipos">
            <div class="flex flex-col gap-4">
                <p-message severity="warn" icon="pi pi-exclamation-triangle" styleClass="w-full">
                    Se borrarán los grupos actuales y se repartirán los {{ teams().length }} equipos inscritos.
                </p-message>

                <div class="flex flex-col gap-2">
                    <label class="font-medium">Cantidad de grupos</label>
                    <p-inputnumber [(ngModel)]="groupCount" [min]="1" [max]="teams().length || 1" [showButtons]="true" class="w-full" />
                    <small class="text-muted-color">{{ distributionHint() }}</small>
                </div>

                <div class="flex items-center gap-3">
                    <p-toggleswitch [(ngModel)]="shuffle" inputId="shuffle" />
                    <label for="shuffle" class="cursor-pointer">
                        <span class="font-medium">Sorteo al azar</span>
                        <div class="text-muted-color text-sm">Sin esto, reparte en serpiente por orden alfabético.</div>
                    </label>
                </div>
            </div>
            <ng-template pTemplate="footer">
                <p-button label="Cancelar" [text]="true" (onClick)="autoDialog = false" />
                <p-button label="Repartir" icon="pi pi-sparkles" [loading]="working()" (onClick)="autoAssign()" />
            </ng-template>
        </p-dialog>
    `
})
export class TournamentGroups implements OnInit {
    private readonly tournamentService = inject(TournamentService);
    private readonly teamService = inject(TeamService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly route = inject(ActivatedRoute);

    readonly tournament = signal<TournamentResponse | null>(null);
    readonly groups = signal<TournamentGroupResponse[]>([]);
    readonly teams = signal<TeamResponse[]>([]);
    readonly loading = signal(true);
    readonly working = signal(false);

    tournamentId!: number;

    groupDialog = false;
    teamsDialog = false;
    autoDialog = false;
    editing = false;
    groupName = '';
    groupCount = 2;
    shuffle = false;
    selectedGroup: TournamentGroupResponse | null = null;
    availableTeams: TeamResponse[] = [];
    groupTeams: TeamResponse[] = [];

    ngOnInit() {
        this.tournamentId = Number(this.route.snapshot.params['id']);
        this.load();
    }

    load() {
        this.loading.set(true);
        forkJoin({
            tournament: this.tournamentService.getTournament(this.tournamentId),
            groups: this.tournamentService.getGroups(this.tournamentId),
            teams: this.teamService.getTeams({ tournament_id: this.tournamentId })
        }).subscribe({
            next: ({ tournament, groups, teams }) => {
                this.tournament.set(tournament.data ?? null);
                this.groups.set(groups.data ?? []);
                this.teams.set(teams.data ?? []);
                this.groupCount = Math.max(2, this.groups().length || 2);
                this.loading.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la información del torneo.' });
                this.loading.set(false);
            }
        });
    }

    /** Teams enrolled in the tournament that no group claims yet. */
    unassigned(): TeamResponse[] {
        const assigned = new Set(this.groups().flatMap((g) => g.teams.map((t) => t.id)));
        return this.teams().filter((team) => !assigned.has(team.id));
    }

    unassignedNames(): string {
        return this.unassigned()
            .map((t) => t.name)
            .join(', ');
    }

    distributionHint(): string {
        const total = this.teams().length;
        if (!total || !this.groupCount) return '';
        const base = Math.floor(total / this.groupCount);
        const remainder = total % this.groupCount;
        return remainder === 0
            ? `${this.groupCount} grupos de ${base} equipos.`
            : `${remainder} grupo(s) de ${base + 1} y ${this.groupCount - remainder} de ${base}.`;
    }

    openNew() {
        this.editing = false;
        this.selectedGroup = null;
        this.groupName = `Grupo ${String.fromCharCode(65 + this.groups().length)}`;
        this.groupDialog = true;
    }

    openEdit(group: TournamentGroupResponse) {
        this.editing = true;
        this.selectedGroup = group;
        this.groupName = group.name;
        this.groupDialog = true;
    }

    saveGroup() {
        if (!this.groupName.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Falta el nombre', detail: 'Escribe un nombre para el grupo.' });
            return;
        }

        const request = this.editing && this.selectedGroup
            ? this.tournamentService.updateGroup(this.tournamentId, this.selectedGroup.id, { name: this.groupName })
            : this.tournamentService.createGroup(this.tournamentId, { name: this.groupName });

        request.subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Grupo guardado.' });
                this.groupDialog = false;
                this.load();
            },
            error: (err) =>
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? 'No se pudo guardar el grupo.' })
        });
    }

    openTeams(group: TournamentGroupResponse) {
        this.selectedGroup = group;
        const memberIds = new Set(group.teams.map((t) => t.id));

        // Teams already in another group stay out of the picker to keep the move explicit.
        const inOtherGroups = new Set(
            this.groups()
                .filter((g) => g.id !== group.id)
                .flatMap((g) => g.teams.map((t) => t.id))
        );

        this.groupTeams = this.teams().filter((team) => memberIds.has(team.id));
        this.availableTeams = this.teams().filter((team) => !memberIds.has(team.id) && !inOtherGroups.has(team.id));
        this.teamsDialog = true;
    }

    saveTeams() {
        if (!this.selectedGroup) return;

        this.tournamentService
            .setGroupTeams(this.tournamentId, this.selectedGroup.id, this.groupTeams.map((t) => t.id))
            .subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Equipos asignados.' });
                    this.teamsDialog = false;
                    this.load();
                },
                error: (err) =>
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? 'No se pudieron asignar los equipos.' })
            });
    }

    autoAssign() {
        this.working.set(true);
        this.tournamentService.autoAssignGroups(this.tournamentId, { group_count: this.groupCount, shuffle: this.shuffle }).subscribe({
            next: () => {
                this.working.set(false);
                this.autoDialog = false;
                this.messageService.add({ severity: 'success', summary: 'Listo', detail: 'Equipos repartidos en grupos.' });
                this.load();
            },
            error: (err) => {
                this.working.set(false);
                this.messageService.add({ severity: 'error', summary: 'No se pudo repartir', detail: err.error?.message ?? 'Inténtalo de nuevo.' });
            }
        });
    }

    remove(group: TournamentGroupResponse) {
        this.confirmationService.confirm({
            header: 'Eliminar grupo',
            message: `¿Eliminar "${group.name}"? Sus equipos quedarán sin grupo.`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.tournamentService.deleteGroup(this.tournamentId, group.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Grupo eliminado.' });
                        this.load();
                    },
                    error: (err) =>
                        this.messageService.add({ severity: 'error', summary: 'No se pudo eliminar', detail: err.error?.message ?? 'Inténtalo de nuevo.' })
                });
            }
        });
    }
}
