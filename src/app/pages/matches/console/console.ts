import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../service/auth.service';
import { CatalogService } from '../../service/catalog.service';
import {
    LineupResponse,
    MatchEventResponse,
    MatchEventType,
    MatchResponse,
    MatchStatus
} from '../../service/interfaces/match.interface';
import { PlayerResponse } from '../../service/interfaces/team.interface';
import { MatchService } from '../../service/match.service';
import { TeamService } from '../../service/team.service';
import { eventTypeSeverity, matchStatusSeverity } from '../../shared/status';

/**
 * The match sheet the staff runs on the touchline: score, timeline of events and
 * the lineups. Goals move the scoreboard on the server, and cards create the
 * suspensions the tournament rules call for, so nothing is bookkept twice here.
 */
@Component({
    selector: 'app-match-console',
    standalone: true,
    imports: [
        CommonModule, FormsModule, RouterModule, ButtonModule, SelectModule, SelectButtonModule,
        InputNumberModule, InputTextModule, DialogModule, ToastModule, ConfirmDialogModule,
        TagModule, TooltipModule, MessageModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-confirmdialog [style]="{ width: '440px' }" />

        @if (loading()) {
            <div class="card text-center py-16 text-muted-color"><i class="pi pi-spin pi-spinner text-3xl"></i></div>
        } @else if (!match()) {
            <div class="card text-center py-16">
                <i class="pi pi-exclamation-circle text-4xl text-muted-color mb-3 block"></i>
                <div class="text-muted-color">No se encontró el partido.</div>
            </div>
        } @else {
            <!-- Marcador -->
            <div class="card">
                <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div class="flex items-center gap-2 text-sm text-muted-color">
                        <p-button icon="pi pi-arrow-left" [rounded]="true" [text]="true" size="small" routerLink="/pages/matches" />
                        <span>{{ stageLabel() }}</span>
                        @if (match()!.round) { <span>· Jornada {{ match()!.round }}</span> }
                        @if (match()!.group_name) { <span>· {{ match()!.group_name }}</span> }
                    </div>
                    <p-tag [value]="statusLabel()" [severity]="statusTone()" />
                </div>

                <div class="flex flex-wrap items-center justify-center gap-6 md:gap-12 mb-6">
                    <div class="text-center flex-1 min-w-[8rem]">
                        <div class="font-semibold text-lg md:text-xl">{{ match()!.home_team_name }}</div>
                        <div class="text-muted-color text-sm">Local</div>
                    </div>

                    <div class="text-center">
                        <div class="text-4xl md:text-5xl font-bold tabular-nums">
                            {{ match()!.home_score }} <span class="text-muted-color">-</span> {{ match()!.away_score }}
                        </div>
                        <div class="text-muted-color text-sm mt-1">{{ match()!.estimated_start_time | date: 'dd MMM · HH:mm' }}</div>
                        <div class="text-muted-color text-xs">{{ match()!.field_name }}</div>
                    </div>

                    <div class="text-center flex-1 min-w-[8rem]">
                        <div class="font-semibold text-lg md:text-xl">{{ match()!.away_team_name }}</div>
                        <div class="text-muted-color text-sm">Visitante</div>
                    </div>
                </div>

                @if (canEdit()) {
                    <div class="flex flex-wrap justify-center gap-2 pt-4 border-t border-surface">
                        @if (match()!.status === 'scheduled' || match()!.status === 'rescheduled') {
                            <p-button label="Iniciar partido" icon="pi pi-play" (onClick)="setStatus('live')" [loading]="working()" />
                        }
                        @if (match()!.status === 'live') {
                            <p-button label="Finalizar partido" icon="pi pi-flag-fill" severity="success"
                                      (onClick)="confirmFinish()" [loading]="working()" />
                        }
                        @if (match()!.status === 'finished') {
                            <p-button label="Reabrir" icon="pi pi-undo" severity="secondary" [outlined]="true"
                                      (onClick)="setStatus('live')" [loading]="working()" />
                        }
                        @if (match()!.status !== 'canceled' && match()!.status !== 'finished') {
                            <p-button label="Cancelar partido" icon="pi pi-times" severity="danger" [outlined]="true"
                                      (onClick)="setStatus('canceled')" [loading]="working()" />
                        }
                    </div>
                }
            </div>

            <div class="grid grid-cols-12 gap-6">
                <!-- Eventos -->
                <div class="col-span-12 xl:col-span-7">
                    <div class="card h-full">
                        <div class="flex justify-between items-center mb-5">
                            <div class="font-semibold text-lg">Eventos del partido</div>
                            @if (canEdit() && match()!.status !== 'canceled') {
                                <p-button label="Registrar" icon="pi pi-plus" size="small" (onClick)="openEvent()" />
                            }
                        </div>

                        @if (events().length === 0) {
                            <div class="text-center py-10">
                                <i class="pi pi-flag text-4xl text-muted-color mb-3 block"></i>
                                <span class="text-muted-color">Todavía no hay eventos registrados.</span>
                            </div>
                        } @else {
                            <ul class="list-none p-0 m-0">
                                @for (event of events(); track event.id) {
                                    <li class="flex items-center gap-3 py-3 border-b border-surface last:border-0">
                                        <span class="tabular-nums text-sm font-medium text-muted-color w-10">{{ event.minute }}'</span>
                                        <p-tag [value]="eventLabel(event.type)" [severity]="eventTone(event.type)" styleClass="text-xs" />
                                        <div class="flex-1 min-w-0">
                                            <div class="font-medium truncate">{{ event.player_name || event.team_name }}</div>
                                            <div class="text-muted-color text-sm truncate">
                                                {{ event.team_name }}{{ event.description ? ' · ' + event.description : '' }}
                                                @if (event.fine_amount > 0) {
                                                    · multa {{ event.fine_amount | currency: 'USD' }}
                                                    @if (event.is_paid) { <span class="text-green-600">(pagada)</span> }
                                                }
                                            </div>
                                        </div>
                                        @if (canEdit()) {
                                            <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" size="small"
                                                      pTooltip="Eliminar evento" (onClick)="removeEvent(event)" />
                                        }
                                    </li>
                                }
                            </ul>
                        }
                    </div>
                </div>

                <!-- Alineaciones -->
                <div class="col-span-12 xl:col-span-5">
                    <div class="card h-full">
                        <div class="font-semibold text-lg mb-4">Alineaciones</div>

                        <p-selectbutton [options]="teamOptions()" [(ngModel)]="selectedTeamId" optionLabel="label"
                                        optionValue="value" (onChange)="loadLineup()" styleClass="w-full mb-4" [allowEmpty]="false" />

                        @if (suspendedPlayers().length > 0) {
                            <p-message severity="warn" icon="pi pi-ban" styleClass="w-full mb-4">
                                Suspendidos: {{ suspendedNames() }}
                            </p-message>
                        }

                        @if (canManageLineup()) {
                            <div class="flex flex-col gap-3 mb-4 pb-4 border-b border-surface">
                                <div class="flex flex-col gap-2">
                                    <label class="font-medium text-sm">Agregar jugador</label>
                                    <p-select [options]="selectablePlayers()" [(ngModel)]="newLineupPlayer"
                                              optionLabel="name" optionValue="id" placeholder="Elige un jugador"
                                              appendTo="body" styleClass="w-full" [filter]="true" filterBy="name" />
                                </div>
                                <div class="flex gap-2">
                                    <p-select [options]="positions()" [(ngModel)]="newLineupPosition" optionLabel="name"
                                              optionValue="name" placeholder="Posición" appendTo="body" styleClass="flex-1" />
                                    <p-button icon="pi pi-plus" (onClick)="addToLineup()" [disabled]="!newLineupPlayer" />
                                </div>
                            </div>
                        }

                        @if (lineup().length === 0) {
                            <div class="text-center py-8">
                                <i class="pi pi-users text-3xl text-muted-color mb-2 block"></i>
                                <span class="text-muted-color text-sm">Sin alineación cargada.</span>
                            </div>
                        } @else {
                            <ul class="list-none p-0 m-0">
                                @for (entry of lineup(); track entry.player_id) {
                                    <li class="flex items-center gap-3 py-2 border-b border-surface last:border-0">
                                        <span class="tabular-nums text-sm text-muted-color w-6">{{ entry.player_number }}</span>
                                        <div class="flex-1 min-w-0">
                                            <div class="truncate" [class.line-through]="entry.suspended">{{ entry.player_name }}</div>
                                            <div class="text-muted-color text-xs">{{ entry.position || 'Sin posición' }}</div>
                                        </div>
                                        @if (entry.suspended) {
                                            <p-tag value="Suspendido" severity="danger" styleClass="text-xs" />
                                        } @else if (!entry.starter) {
                                            <p-tag value="Suplente" severity="secondary" styleClass="text-xs" />
                                        }
                                        @if (canManageLineup()) {
                                            <p-button icon="pi pi-times" [rounded]="true" [text]="true" severity="danger" size="small"
                                                      (onClick)="removeFromLineup(entry)" />
                                        }
                                    </li>
                                }
                            </ul>
                        }
                    </div>
                </div>
            </div>

            <!-- Registrar evento -->
            <p-dialog [(visible)]="eventDialog" [style]="{ width: '480px' }" [modal]="true" header="Registrar evento">
                <div class="flex flex-col gap-4">
                    <div class="flex flex-col gap-2">
                        <label class="font-medium">Equipo</label>
                        <p-select [options]="teamOptions()" [(ngModel)]="eventForm.team_id" optionLabel="label"
                                  optionValue="value" appendTo="body" (onChange)="onEventTeamChange()" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label class="font-medium">Tipo de evento</label>
                        <p-select [options]="eventTypes()" [(ngModel)]="eventForm.type" optionLabel="name"
                                  optionValue="id" appendTo="body" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label class="font-medium">Jugador {{ requiresPlayer() ? '' : '(opcional)' }}</label>
                        <p-select [options]="eventPlayers()" [(ngModel)]="eventForm.player_id" optionLabel="name"
                                  optionValue="id" placeholder="Elige un jugador" appendTo="body"
                                  [showClear]="!requiresPlayer()" [filter]="true" filterBy="name" />
                    </div>

                    <div class="flex gap-3">
                        <div class="flex flex-col gap-2 flex-1">
                            <label class="font-medium">Minuto</label>
                            <p-inputnumber [(ngModel)]="eventForm.minute" [min]="0" [max]="150" [showButtons]="true" class="w-full" />
                        </div>
                        @if (eventForm.type === 'fine' || eventForm.type === 'red_card') {
                            <div class="flex flex-col gap-2 flex-1">
                                <label class="font-medium">Multa</label>
                                <p-inputnumber [(ngModel)]="eventForm.fine_amount" mode="currency" currency="USD"
                                               locale="es" [min]="0" class="w-full" />
                            </div>
                        }
                    </div>

                    <div class="flex flex-col gap-2">
                        <label class="font-medium">Nota (opcional)</label>
                        <input pInputText [(ngModel)]="eventForm.description" placeholder="Gol de cabeza, juego brusco…" />
                    </div>

                    @if (eventForm.type === 'yellow_card' || eventForm.type === 'red_card') {
                        <p-message severity="secondary" icon="pi pi-info-circle" styleClass="w-full">
                            Las suspensiones se aplican solas según las reglas del torneo.
                        </p-message>
                    }
                </div>

                <ng-template pTemplate="footer">
                    <p-button label="Cancelar" [text]="true" (onClick)="eventDialog = false" />
                    <p-button label="Registrar" icon="pi pi-check" [loading]="working()" (onClick)="saveEvent()" />
                </ng-template>
            </p-dialog>
        }
    `
})
export class MatchConsole implements OnInit {
    private readonly matchService = inject(MatchService);
    private readonly teamService = inject(TeamService);
    private readonly catalogService = inject(CatalogService);
    private readonly authService = inject(AuthService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly route = inject(ActivatedRoute);

    readonly match = signal<MatchResponse | null>(null);
    readonly events = signal<MatchEventResponse[]>([]);
    readonly lineup = signal<LineupResponse[]>([]);
    readonly loading = signal(true);
    readonly working = signal(false);

    /** Squads by team id, so the event and lineup pickers never refetch. */
    private readonly squads = signal<Record<number, PlayerResponse[]>>({});

    matchId!: number;
    selectedTeamId = 0;
    eventDialog = false;
    newLineupPlayer?: number;
    newLineupPosition = '';

    eventForm: { team_id: number; type: MatchEventType; player_id?: number | null; minute: number; description: string; fine_amount: number } = {
        team_id: 0,
        type: 'goal',
        player_id: null,
        minute: 1,
        description: '',
        fine_amount: 0
    };

    readonly suspendedPlayers = computed(() => this.lineup().filter((entry) => entry.suspended));

    ngOnInit() {
        this.matchId = Number(this.route.snapshot.params['id']);
        this.load();
    }

    load() {
        this.loading.set(true);
        this.matchService.getMatch(this.matchId).subscribe({
            next: (res) => {
                const details = res.data;
                if (!details?.match) {
                    this.loading.set(false);
                    return;
                }

                this.match.set(details.match);
                this.events.set(details.events ?? []);
                this.selectedTeamId = this.selectedTeamId || details.match.home_team_id;
                this.eventForm.team_id = this.selectedTeamId;

                this.loadSquads(details.match);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el partido.' });
                this.loading.set(false);
            }
        });
    }

    private loadSquads(match: MatchResponse) {
        forkJoin({
            home: this.teamService.getPlayers(match.home_team_id),
            away: this.teamService.getPlayers(match.away_team_id)
        }).subscribe({
            next: ({ home, away }) => {
                this.squads.set({
                    [match.home_team_id]: home.data ?? [],
                    [match.away_team_id]: away.data ?? []
                });
                this.loadLineup();
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    loadLineup() {
        if (!this.selectedTeamId) return;

        this.matchService
            .getLineup(this.matchId, this.selectedTeamId)
            .pipe(catchError(() => of({ data: [] as LineupResponse[] })))
            .subscribe((res) => this.lineup.set(res.data ?? []));
    }

    // --- Permissions ---

    canEdit(): boolean {
        return this.authService.isStaffOrAdmin();
    }

    /** A manager may only set the lineup of the team they own. */
    canManageLineup(): boolean {
        if (this.match()?.status === 'finished' || this.match()?.status === 'canceled') return false;
        return true;
    }

    // --- Labels ---

    stageLabel(): string {
        return this.catalogService.label('match_stages', this.match()?.stage);
    }

    statusLabel(): string {
        return this.catalogService.label('match_statuses', this.match()?.status);
    }

    statusTone() {
        return matchStatusSeverity(this.match()?.status);
    }

    eventLabel(type: string): string {
        return this.catalogService.label('match_event_types', type);
    }

    eventTone(type: string) {
        return eventTypeSeverity(type);
    }

    eventTypes() {
        return this.catalogService.get('match_event_types');
    }

    positions() {
        return this.catalogService.get('lineup_positions');
    }

    teamOptions() {
        const match = this.match();
        if (!match) return [];
        return [
            { label: match.home_team_name, value: match.home_team_id },
            { label: match.away_team_name, value: match.away_team_id }
        ];
    }

    suspendedNames(): string {
        return this.suspendedPlayers()
            .map((entry) => entry.player_name)
            .join(', ');
    }

    // --- Lineup ---

    /** Players of the selected team that are not already listed. */
    selectablePlayers(): PlayerResponse[] {
        const listed = new Set(this.lineup().map((entry) => entry.player_id));
        return (this.squads()[this.selectedTeamId] ?? []).filter((player) => !listed.has(player.id));
    }

    addToLineup() {
        if (!this.newLineupPlayer) return;

        const players = [
            ...this.lineup().map((entry) => ({
                player_id: entry.player_id,
                position: entry.position,
                starter: entry.starter
            })),
            { player_id: this.newLineupPlayer, position: this.newLineupPosition || 'Sin posición', starter: true }
        ];

        this.matchService.setLineup(this.matchId, this.selectedTeamId, { players }).subscribe({
            next: (res) => {
                this.lineup.set(res.data ?? []);
                this.newLineupPlayer = undefined;
                this.newLineupPosition = '';
                this.messageService.add({ severity: 'success', summary: 'Listo', detail: 'Alineación actualizada.' });
            },
            error: (err) =>
                this.messageService.add({
                    severity: 'error',
                    summary: 'No se pudo alinear',
                    detail: err.error?.message ?? 'Inténtalo de nuevo.'
                })
        });
    }

    removeFromLineup(entry: LineupResponse) {
        this.matchService.removeFromLineup(this.matchId, this.selectedTeamId, entry.player_id).subscribe({
            next: () => {
                this.lineup.set(this.lineup().filter((item) => item.player_id !== entry.player_id));
                this.messageService.add({ severity: 'success', summary: 'Listo', detail: `${entry.player_name} salió de la alineación.` });
            },
            error: (err) =>
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? 'No se pudo quitar al jugador.' })
        });
    }

    // --- Events ---

    openEvent() {
        this.eventForm = {
            team_id: this.selectedTeamId || this.match()!.home_team_id,
            type: 'goal',
            player_id: null,
            minute: 1,
            description: '',
            fine_amount: 0
        };
        this.eventDialog = true;
    }

    onEventTeamChange() {
        this.eventForm.player_id = null;
    }

    eventPlayers(): PlayerResponse[] {
        return this.squads()[this.eventForm.team_id] ?? [];
    }

    requiresPlayer(): boolean {
        return ['goal', 'yellow_card', 'red_card'].includes(this.eventForm.type);
    }

    saveEvent() {
        if (this.requiresPlayer() && !this.eventForm.player_id) {
            this.messageService.add({ severity: 'warn', summary: 'Falta el jugador', detail: 'Este evento necesita un jugador.' });
            return;
        }

        this.working.set(true);
        this.matchService
            .addEvent(this.matchId, {
                team_id: this.eventForm.team_id,
                type: this.eventForm.type,
                player_id: this.eventForm.player_id ?? null,
                minute: this.eventForm.minute,
                description: this.eventForm.description,
                fine_amount: this.eventForm.fine_amount
            })
            .subscribe({
                next: () => {
                    this.working.set(false);
                    this.eventDialog = false;
                    this.messageService.add({ severity: 'success', summary: 'Registrado', detail: 'Evento cargado.' });
                    this.load();
                },
                error: (err) => {
                    this.working.set(false);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'No se pudo registrar',
                        detail: err.error?.message ?? 'Inténtalo de nuevo.'
                    });
                }
            });
    }

    removeEvent(event: MatchEventResponse) {
        this.confirmationService.confirm({
            header: 'Eliminar evento',
            message: `¿Eliminar ${this.eventLabel(event.type).toLowerCase()} del minuto ${event.minute}? Si era un gol, el marcador se corrige.`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.matchService.deleteEvent(this.matchId, event.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Evento eliminado.' });
                        this.load();
                    },
                    error: (err) =>
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? 'No se pudo eliminar.' })
                });
            }
        });
    }

    // --- Status ---

    confirmFinish() {
        this.confirmationService.confirm({
            header: 'Finalizar partido',
            message: 'El resultado pasará a la tabla y las sanciones vigentes cumplirán una fecha. ¿Finalizar?',
            icon: 'pi pi-flag',
            acceptLabel: 'Finalizar',
            rejectLabel: 'Cancelar',
            accept: () => this.setStatus('finished')
        });
    }

    setStatus(status: MatchStatus) {
        this.working.set(true);
        this.matchService.updateMatch(this.matchId, { status }).subscribe({
            next: () => {
                this.working.set(false);
                this.messageService.add({ severity: 'success', summary: 'Listo', detail: 'Estado actualizado.' });
                this.load();
            },
            error: (err) => {
                this.working.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? 'No se pudo cambiar el estado.' });
            }
        });
    }
}
