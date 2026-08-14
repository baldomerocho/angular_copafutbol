import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { FluidModule } from 'primeng/fluid';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin } from 'rxjs';
import { AuthService } from '../service/auth.service';
import { CatalogService } from '../service/catalog.service';
import { FieldService } from '../service/field.service';
import { FieldResponse } from '../service/interfaces/field.interface';
import { MatchRequest, MatchResponse } from '../service/interfaces/match.interface';
import { TeamResponse } from '../service/interfaces/team.interface';
import { TournamentResponse } from '../service/interfaces/tournament.interface';
import { MatchService } from '../service/match.service';
import { TeamService } from '../service/team.service';
import { TournamentService } from '../service/tournament.service';
import { matchStatusSeverity } from '../shared/status';

@Component({
    selector: 'app-matches',
    standalone: true,
    imports: [
        CommonModule, FormsModule, RouterModule, TableModule, ButtonModule, DialogModule, ToastModule,
        ToolbarModule, ConfirmDialogModule, SelectModule, DatePickerModule, FluidModule, TagModule, TooltipModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-confirmdialog [style]="{ width: '440px' }" />

        <div class="card">
            <p-toolbar styleClass="mb-4">
                <ng-template pTemplate="start">
                    <div>
                        <h1 class="text-xl font-semibold m-0">Partidos</h1>
                        <p class="text-muted-color text-sm mt-1 mb-0">Abre un partido para cargar goles, tarjetas y alineaciones.</p>
                    </div>
                </ng-template>
                <ng-template pTemplate="end">
                    @if (canEdit()) {
                        <p-button label="Programar partido" icon="pi pi-calendar-plus" (onClick)="openNew()" />
                    }
                </ng-template>
            </p-toolbar>

            <div class="flex flex-wrap gap-3 mb-4">
                <p-select [options]="tournaments()" [(ngModel)]="tournamentFilter" (onChange)="reload()"
                          optionLabel="name" optionValue="id" placeholder="Todos los torneos"
                          [showClear]="true" styleClass="w-full sm:w-64" />
                <p-select [options]="statusOptions()" [(ngModel)]="statusFilter" (onChange)="reload()"
                          optionLabel="name" optionValue="id" placeholder="Todos los estados"
                          [showClear]="true" styleClass="w-full sm:w-52" />
            </div>

            <!-- Server-side: a full season is thousands of matches. -->
            <p-table [value]="matches()" [lazy]="true" (onLazyLoad)="loadPage($event)"
                     [paginator]="true" [rows]="perPage" [totalRecords]="total()" [first]="first"
                     [rowsPerPageOptions]="[15, 30, 60]" [loading]="loading()"
                     currentPageReportTemplate="{first} - {last} de {totalRecords}" [showCurrentPageReport]="true"
                     responsiveLayout="scroll" dataKey="id">
                <ng-template pTemplate="header">
                    <tr>
                        <th>Fecha</th>
                        <th>Fase</th>
                        <th class="text-right">Local</th>
                        <th class="text-center" style="width: 6rem">Marcador</th>
                        <th>Visitante</th>
                        <th>Sede</th>
                        <th>Estado</th>
                        <th style="width: 9rem">Acciones</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-match>
                    <tr>
                        <td class="whitespace-nowrap">
                            <div>{{ match.estimated_start_time | date: 'dd/MM/yyyy' }}</div>
                            <div class="text-muted-color text-sm tabular-nums">{{ match.estimated_start_time | date: 'HH:mm' }}</div>
                        </td>
                        <td>
                            <div class="text-sm">{{ stageLabel(match.stage) }}</div>
                            @if (match.round) { <div class="text-muted-color text-xs">Jornada {{ match.round }}</div> }
                        </td>
                        <td class="text-right font-medium">{{ match.home_team_name }}</td>
                        <td class="text-center">
                            @if (match.status === 'finished' || match.status === 'live') {
                                <span class="font-bold tabular-nums">{{ match.home_score }} - {{ match.away_score }}</span>
                            } @else {
                                <span class="text-muted-color">–</span>
                            }
                        </td>
                        <td class="font-medium">{{ match.away_team_name }}</td>
                        <td class="text-sm text-muted-color">{{ match.field_name || '—' }}</td>
                        <td><p-tag [value]="statusLabel(match.status)" [severity]="tone(match.status)" /></td>
                        <td>
                            <div class="flex gap-1">
                                <p-button icon="pi pi-list-check" [rounded]="true" [text]="true"
                                          pTooltip="Abrir planilla" tooltipPosition="top"
                                          [routerLink]="['/pages/matches', match.id]" />
                                @if (canEdit()) {
                                    <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="secondary"
                                              pTooltip="Reprogramar" tooltipPosition="top" (onClick)="openEdit(match)" />
                                    <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger"
                                              pTooltip="Eliminar" tooltipPosition="top" (onClick)="remove(match)" />
                                }
                            </div>
                        </td>
                    </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="8">
                            <div class="text-center py-10">
                                <i class="pi pi-calendar-times text-4xl text-muted-color mb-3 block"></i>
                                <div class="text-muted-color">No hay partidos con estos filtros.</div>
                            </div>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <p-dialog [(visible)]="matchDialog" [style]="{ width: '520px' }" [modal]="true"
                  [header]="editing ? 'Reprogramar partido' : 'Programar partido'">
            <p-fluid>
                <div class="flex flex-col gap-4">
                    @if (!editing) {
                        <div class="flex flex-col gap-2">
                            <label class="font-medium">Torneo</label>
                            <p-select [options]="tournaments()" [(ngModel)]="form.tournament_id" optionLabel="name"
                                      optionValue="id" placeholder="Selecciona un torneo" appendTo="body"
                                      (onChange)="loadTeamsForTournament()" />
                        </div>

                        <div class="grid grid-cols-12 gap-3">
                            <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                <label class="font-medium">Equipo local</label>
                                <p-select [options]="teams()" [(ngModel)]="form.home_team_id" optionLabel="name"
                                          optionValue="id" placeholder="Local" appendTo="body" [filter]="true" filterBy="name" />
                            </div>
                            <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                <label class="font-medium">Equipo visitante</label>
                                <p-select [options]="teams()" [(ngModel)]="form.away_team_id" optionLabel="name"
                                          optionValue="id" placeholder="Visitante" appendTo="body" [filter]="true" filterBy="name" />
                            </div>
                        </div>

                        <div class="flex flex-col gap-2">
                            <label class="font-medium">Fase</label>
                            <p-select [options]="stageOptions()" [(ngModel)]="form.stage" optionLabel="name"
                                      optionValue="id" appendTo="body" />
                        </div>
                    }

                    <div class="flex flex-col gap-2">
                        <label class="font-medium">Sede</label>
                        <p-select [options]="fields()" [(ngModel)]="form.field_id" optionLabel="name" optionValue="id"
                                  placeholder="Selecciona una sede" appendTo="body" [showClear]="true" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label class="font-medium">Fecha y hora</label>
                        <p-datepicker [(ngModel)]="matchDate" [showTime]="true" [showIcon]="true" appendTo="body"
                                      dateFormat="dd/mm/yy" hourFormat="24" />
                    </div>
                </div>
            </p-fluid>

            <ng-template pTemplate="footer">
                <p-button label="Cancelar" [text]="true" (onClick)="matchDialog = false" />
                <p-button label="Guardar" icon="pi pi-check" [loading]="working()" (onClick)="save()" />
            </ng-template>
        </p-dialog>
    `
})
export class Matches implements OnInit {
    private readonly matchService = inject(MatchService);
    private readonly tournamentService = inject(TournamentService);
    private readonly teamService = inject(TeamService);
    private readonly fieldService = inject(FieldService);
    private readonly catalogService = inject(CatalogService);
    private readonly authService = inject(AuthService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    readonly matches = signal<MatchResponse[]>([]);
    readonly tournaments = signal<TournamentResponse[]>([]);
    readonly teams = signal<TeamResponse[]>([]);
    readonly fields = signal<FieldResponse[]>([]);
    readonly loading = signal(true);
    readonly working = signal(false);

    tournamentFilter?: number;
    statusFilter?: string;
    first = 0;
    perPage = 15;
    readonly total = signal(0);

    matchDialog = false;
    editing = false;
    editingId?: number;
    matchDate = new Date();
    form: MatchRequest = {
        tournament_id: 0,
        home_team_id: 0,
        away_team_id: 0,
        estimated_start_time: '',
        stage: 'group'
    };

    ngOnInit() {
        forkJoin({
            tournaments: this.tournamentService.getTournaments(),
            fields: this.fieldService.getFields()
        }).subscribe({
            next: ({ tournaments, fields }) => {
                this.tournaments.set(tournaments.data ?? []);
                this.fields.set(fields.data ?? []);
            }
        });
        // The lazy table fires onLazyLoad on init; that is what loads the first page.
    }

    canEdit(): boolean {
        return this.authService.isStaffOrAdmin();
    }

    statusOptions() {
        return this.catalogService.get('match_statuses');
    }

    stageOptions() {
        return this.catalogService.get('match_stages');
    }

    statusLabel(status: string) {
        return this.catalogService.label('match_statuses', status);
    }

    stageLabel(stage: string) {
        return this.catalogService.label('match_stages', stage);
    }

    tone(status: string) {
        return matchStatusSeverity(status);
    }

    /** Fired by the table on paginate, and once on init to load the first page. */
    loadPage(event: TableLazyLoadEvent) {
        this.first = event.first ?? 0;
        this.perPage = event.rows ?? this.perPage;
        this.load();
    }

    /** A narrower filter makes the current offset meaningless. */
    reload() {
        this.first = 0;
        this.load();
    }

    load() {
        this.loading.set(true);
        this.matchService
            .getMatches({
                tournament_id: this.tournamentFilter,
                status: this.statusFilter,
                page: Math.floor(this.first / this.perPage) + 1,
                per_page: this.perPage
            })
            .subscribe({
            next: (res) => {
                this.matches.set(res.data ?? []);
                this.total.set(res.meta?.total ?? (res.data ?? []).length);
                this.loading.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los partidos.' });
                this.loading.set(false);
            }
        });
    }

    loadTeamsForTournament() {
        if (!this.form.tournament_id) return;
        this.teamService.getTeams({ tournament_id: this.form.tournament_id }).subscribe({
            next: (res) => this.teams.set(res.data ?? [])
        });
    }

    openNew() {
        this.editing = false;
        this.editingId = undefined;
        this.form = {
            tournament_id: this.tournamentFilter ?? 0,
            home_team_id: 0,
            away_team_id: 0,
            estimated_start_time: '',
            stage: 'group'
        };
        this.matchDate = new Date();
        this.teams.set([]);
        if (this.form.tournament_id) this.loadTeamsForTournament();
        this.matchDialog = true;
    }

    openEdit(match: MatchResponse) {
        this.editing = true;
        this.editingId = match.id;
        this.form = {
            tournament_id: match.tournament_id,
            home_team_id: match.home_team_id,
            away_team_id: match.away_team_id,
            field_id: match.field_id,
            estimated_start_time: match.estimated_start_time,
            stage: match.stage
        };
        this.matchDate = new Date(match.estimated_start_time);
        this.matchDialog = true;
    }

    save() {
        if (this.editing && this.editingId) {
            this.working.set(true);
            this.matchService
                .updateMatch(this.editingId, {
                    estimated_start_time: this.matchDate.toISOString(),
                    field_id: this.form.field_id
                })
                .subscribe({
                    next: () => {
                        this.working.set(false);
                        this.matchDialog = false;
                        this.messageService.add({ severity: 'success', summary: 'Listo', detail: 'Partido reprogramado.' });
                        this.load();
                    },
                    error: (err) => {
                        this.working.set(false);
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? 'No se pudo reprogramar.' });
                    }
                });
            return;
        }

        if (!this.form.tournament_id || !this.form.home_team_id || !this.form.away_team_id) {
            this.messageService.add({ severity: 'warn', summary: 'Faltan datos', detail: 'Elige torneo y ambos equipos.' });
            return;
        }
        if (this.form.home_team_id === this.form.away_team_id) {
            this.messageService.add({ severity: 'warn', summary: 'Equipos iguales', detail: 'Un equipo no puede jugar contra sí mismo.' });
            return;
        }

        this.working.set(true);
        this.matchService.createMatch({ ...this.form, estimated_start_time: this.matchDate.toISOString() }).subscribe({
            next: () => {
                this.working.set(false);
                this.matchDialog = false;
                this.messageService.add({ severity: 'success', summary: 'Listo', detail: 'Partido programado.' });
                this.load();
            },
            error: (err) => {
                this.working.set(false);
                this.messageService.add({ severity: 'error', summary: 'No se pudo programar', detail: err.error?.message ?? 'Inténtalo de nuevo.' });
            }
        });
    }

    remove(match: MatchResponse) {
        this.confirmationService.confirm({
            header: 'Eliminar partido',
            message: `Se eliminarán también sus eventos y alineaciones. ¿Eliminar ${match.home_team_name} vs ${match.away_team_name}?`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.matchService.deleteMatch(match.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Partido eliminado.' });
                        this.load();
                    },
                    error: (err) =>
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? 'No se pudo eliminar.' })
                });
            }
        });
    }
}
