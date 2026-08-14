import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { FluidModule } from 'primeng/fluid';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SuspensionResponse } from '../../service/interfaces/match.interface';
import { PlayerResponse, TeamResponse } from '../../service/interfaces/team.interface';
import { MatchService } from '../../service/match.service';
import { TeamService } from '../../service/team.service';

@Component({
    selector: 'app-players',
    standalone: true,
    imports: [
        CommonModule, FormsModule, RouterModule, TableModule, ButtonModule, InputTextModule, InputNumberModule,
        DialogModule, ToastModule, ToolbarModule, ConfirmDialogModule, FluidModule, IconFieldModule,
        InputIconModule, TagModule, TooltipModule, MessageModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-confirmdialog [style]="{ width: '440px' }" />

        <div class="card">
            <p-toolbar styleClass="mb-4">
                <ng-template pTemplate="start">
                    <div class="flex items-center gap-2">
                        <p-button icon="pi pi-arrow-left" [rounded]="true" [text]="true" routerLink="/pages/teams" />
                        <div>
                            <h1 class="text-xl font-semibold m-0">Plantilla · {{ team()?.name }}</h1>
                            <p class="text-muted-color text-sm mt-1 mb-0">
                                {{ players().length }} jugadores{{ team()?.tournament?.name ? ' · ' + team()!.tournament!.name : '' }}
                            </p>
                        </div>
                    </div>
                </ng-template>
                <ng-template pTemplate="end">
                    <p-button label="Agregar jugador" icon="pi pi-plus" (onClick)="openNew()" />
                </ng-template>
            </p-toolbar>

            @if (suspended().length > 0) {
                <p-message severity="warn" icon="pi pi-ban" styleClass="w-full mb-4">
                    Con sanción vigente: {{ suspendedNames() }}
                </p-message>
            }

            <p-iconfield class="mb-4 block max-w-md">
                <p-inputicon class="pi pi-search" />
                <input pInputText type="text" placeholder="Buscar jugador" class="w-full"
                       (input)="applySearch($any($event.target).value)" />
            </p-iconfield>

            <p-table [value]="filtered()" [rows]="20" [paginator]="filtered().length > 20"
                     [loading]="loading()" responsiveLayout="scroll" dataKey="id">
                <ng-template pTemplate="header">
                    <tr>
                        <th style="width: 5rem">Dorsal</th>
                        <th>Jugador</th>
                        <th>Estado</th>
                        <th style="width: 8rem">Acciones</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-player>
                    <tr>
                        <td>
                            <span class="inline-flex items-center justify-center bg-emphasis rounded-full font-semibold tabular-nums"
                                  style="width: 2rem; height: 2rem">{{ player.number }}</span>
                        </td>
                        <td class="font-medium">{{ player.name }}</td>
                        <td>
                            @if (isSuspended(player.id)) {
                                <p-tag value="Suspendido" severity="danger" />
                            } @else {
                                <p-tag value="Disponible" severity="success" />
                            }
                        </td>
                        <td>
                            <div class="flex gap-1">
                                <p-button icon="pi pi-pencil" [rounded]="true" [text]="true"
                                          pTooltip="Editar" tooltipPosition="top" (onClick)="openEdit(player)" />
                                <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger"
                                          pTooltip="Quitar del equipo" tooltipPosition="top" (onClick)="remove(player)" />
                            </div>
                        </td>
                    </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="4">
                            <div class="text-center py-10">
                                <i class="pi pi-id-card text-4xl text-muted-color mb-3 block"></i>
                                <div class="text-muted-color mb-4">Esta plantilla está vacía.</div>
                                <p-button label="Agregar el primer jugador" icon="pi pi-plus" (onClick)="openNew()" />
                            </div>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <p-dialog [(visible)]="playerDialog" [style]="{ width: '420px' }" [modal]="true"
                  [header]="editing ? 'Editar jugador' : 'Agregar jugador'">
            <p-fluid>
                <div class="flex flex-col gap-4">
                    <div class="flex flex-col gap-2">
                        <label class="font-medium">Nombre <span class="text-red-500">*</span></label>
                        <input pInputText [(ngModel)]="form.name" placeholder="Nombre y apellido" />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="font-medium">Dorsal <span class="text-red-500">*</span></label>
                        <p-inputnumber [(ngModel)]="form.number" [min]="1" [max]="99" [showButtons]="true" />
                        <small class="text-muted-color">No puede repetirse dentro del mismo equipo.</small>
                    </div>
                </div>
            </p-fluid>

            <ng-template pTemplate="footer">
                <p-button label="Cancelar" [text]="true" (onClick)="playerDialog = false" />
                <p-button label="Guardar" icon="pi pi-check" [loading]="working()" (onClick)="save()" />
            </ng-template>
        </p-dialog>
    `
})
export class Players implements OnInit {
    private readonly teamService = inject(TeamService);
    private readonly matchService = inject(MatchService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    readonly team = signal<TeamResponse | null>(null);
    readonly players = signal<PlayerResponse[]>([]);
    readonly filtered = signal<PlayerResponse[]>([]);
    readonly suspended = signal<SuspensionResponse[]>([]);
    readonly loading = signal(true);
    readonly working = signal(false);

    teamId!: number;
    playerDialog = false;
    editing = false;
    editingId?: number;
    form = { name: '', number: 1 };
    private search = '';

    ngOnInit() {
        this.teamId = Number(this.route.snapshot.params['id']);
        if (!this.teamId) {
            this.router.navigate(['/pages/teams']);
            return;
        }
        this.load();
    }

    load() {
        this.loading.set(true);
        forkJoin({
            team: this.teamService.getTeam(this.teamId),
            players: this.teamService.getPlayers(this.teamId),
            // Suspensions are staff-scoped; managers get an empty list instead of an error.
            suspensions: this.matchService
                .getSuspensions({ team_id: this.teamId, active: true })
                .pipe(catchError(() => of({ data: [] as SuspensionResponse[] })))
        }).subscribe({
            next: ({ team, players, suspensions }) => {
                this.team.set(team.data ?? null);
                this.players.set(players.data ?? []);
                this.suspended.set(suspensions.data ?? []);
                this.applySearch(this.search);
                this.loading.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la plantilla.' });
                this.loading.set(false);
            }
        });
    }

    applySearch(term: string) {
        this.search = term ?? '';
        const needle = this.search.trim().toLowerCase();
        this.filtered.set(
            needle ? this.players().filter((player) => player.name.toLowerCase().includes(needle)) : this.players()
        );
    }

    isSuspended(playerId: number): boolean {
        return this.suspended().some((s) => s.player_id === playerId);
    }

    suspendedNames(): string {
        return this.suspended()
            .map((s) => s.player_name)
            .join(', ');
    }

    openNew() {
        this.editing = false;
        this.editingId = undefined;
        this.form = { name: '', number: this.nextFreeNumber() };
        this.playerDialog = true;
    }

    openEdit(player: PlayerResponse) {
        this.editing = true;
        this.editingId = player.id;
        this.form = { name: player.name, number: player.number };
        this.playerDialog = true;
    }

    /** Suggests the lowest shirt number nobody wears yet. */
    private nextFreeNumber(): number {
        const taken = new Set(this.players().map((player) => player.number));
        for (let number = 1; number <= 99; number++) {
            if (!taken.has(number)) return number;
        }
        return 1;
    }

    save() {
        if (!this.form.name.trim() || !this.form.number) {
            this.messageService.add({ severity: 'warn', summary: 'Faltan datos', detail: 'Nombre y dorsal son obligatorios.' });
            return;
        }

        this.working.set(true);
        const payload = { name: this.form.name.trim(), number: this.form.number };
        const request = this.editing && this.editingId
            ? this.teamService.updatePlayer(this.teamId, this.editingId, payload)
            : this.teamService.addPlayer(this.teamId, payload);

        request.subscribe({
            next: () => {
                this.working.set(false);
                this.playerDialog = false;
                this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Jugador guardado.' });
                this.load();
            },
            error: (err) => {
                this.working.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? 'No se pudo guardar el jugador.' });
            }
        });
    }

    remove(player: PlayerResponse) {
        this.confirmationService.confirm({
            header: 'Quitar jugador',
            message: `¿Quitar a ${player.name} de la plantilla?`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Quitar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.teamService.deletePlayer(this.teamId, player.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Listo', detail: 'Jugador retirado.' });
                        this.load();
                    },
                    error: (err) =>
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? 'No se pudo quitar.' })
                });
            }
        });
    }
}
