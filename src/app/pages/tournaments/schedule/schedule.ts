import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin } from 'rxjs';
import { CatalogService } from '../../service/catalog.service';
import { BracketRound, MatchResponse } from '../../service/interfaces/match.interface';
import { TournamentResponse } from '../../service/interfaces/tournament.interface';
import { MatchService } from '../../service/match.service';
import { TournamentService } from '../../service/tournament.service';
import { matchStatusSeverity } from '../../shared/status';

interface Matchday {
    round: number;
    date: string;
    matches: MatchResponse[];
}

/** Calendar generation and the resulting matchdays, plus the knockout bracket. */
@Component({
    selector: 'app-tournament-schedule',
    standalone: true,
    imports: [
        CommonModule, FormsModule, RouterModule, ButtonModule, TableModule, ToastModule,
        ToolbarModule, ConfirmDialogModule, TagModule, TooltipModule, MessageModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-confirmdialog [style]="{ width: '460px' }" />

        <div class="card">
            <p-toolbar styleClass="mb-4">
                <ng-template pTemplate="start">
                    <div>
                        <h1 class="text-xl font-semibold m-0">Calendario · {{ tournament()?.name }}</h1>
                        <p class="text-muted-color text-sm mt-1 mb-0">{{ summary() }}</p>
                    </div>
                </ng-template>
                <ng-template pTemplate="end">
                    <div class="flex flex-wrap gap-2">
                        <p-button label="Generar calendario" icon="pi pi-calendar-plus" [loading]="working()"
                                  (onClick)="generateFixtures()" />
                        <p-button label="Generar eliminatoria" icon="pi pi-sitemap" severity="secondary"
                                  [loading]="working()" (onClick)="generateKnockout()" />
                        @if (matchdays().length > 0) {
                            <p-button label="Borrar programados" icon="pi pi-trash" severity="danger" [outlined]="true"
                                      (onClick)="clear()" />
                        }
                    </div>
                </ng-template>
            </p-toolbar>

            @if (loading()) {
                <div class="text-center py-10 text-muted-color"><i class="pi pi-spin pi-spinner text-2xl"></i></div>
            } @else if (matchdays().length === 0 && bracket().length === 0) {
                <div class="text-center py-12">
                    <i class="pi pi-calendar text-4xl text-muted-color mb-3 block"></i>
                    <div class="text-muted-color mb-2">Este torneo no tiene partidos programados.</div>
                    <p class="text-muted-color text-sm max-w-lg mx-auto mb-5">
                        El generador reparte los cruces según el formato del torneo y los distribuye entre las sedes
                        disponibles, respetando el día de juego y la separación entre turnos.
                    </p>
                    <p-button label="Generar calendario" icon="pi pi-calendar-plus" [loading]="working()" (onClick)="generateFixtures()" />
                </div>
            } @else {
                @for (day of matchdays(); track day.round) {
                    <div class="mb-6">
                        <div class="flex items-baseline justify-between mb-2">
                            <div class="font-semibold text-lg">Jornada {{ day.round }}</div>
                            <div class="text-muted-color text-sm">{{ day.date | date: 'EEEE d MMMM' }}</div>
                        </div>
                        <div class="border border-surface rounded-border overflow-hidden">
                            @for (match of day.matches; track match.id) {
                                <div class="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-surface last:border-0 hover:bg-emphasis transition-colors">
                                    <span class="text-sm tabular-nums text-muted-color w-12">{{ match.estimated_start_time | date: 'HH:mm' }}</span>
                                    <span class="flex-1 text-right font-medium truncate min-w-[6rem]">{{ match.home_team_name }}</span>
                                    @if (match.status === 'finished' || match.status === 'live') {
                                        <span class="font-bold tabular-nums px-2">{{ match.home_score }} - {{ match.away_score }}</span>
                                    } @else {
                                        <span class="text-muted-color text-sm px-2">vs</span>
                                    }
                                    <span class="flex-1 font-medium truncate min-w-[6rem]">{{ match.away_team_name }}</span>
                                    <span class="text-sm text-muted-color w-32 truncate">{{ match.field_name }}</span>
                                    @if (match.group_name) {
                                        <p-tag [value]="match.group_name" severity="secondary" styleClass="text-xs" />
                                    }
                                    <p-tag [value]="statusLabel(match.status)" [severity]="tone(match.status)" styleClass="text-xs" />
                                    <p-button icon="pi pi-chevron-right" [rounded]="true" [text]="true" size="small"
                                              pTooltip="Abrir planilla" [routerLink]="['/pages/matches', match.id]" />
                                </div>
                            }
                        </div>
                    </div>
                }

                @if (bracket().length > 0) {
                    <div class="mt-8">
                        <div class="font-semibold text-lg mb-3">Fase eliminatoria</div>
                        <div class="grid grid-cols-12 gap-4">
                            @for (round of bracket(); track round.stage) {
                                <div class="col-span-12 md:col-span-6 xl:col-span-4">
                                    <div class="border border-surface rounded-border p-4 h-full">
                                        <div class="font-medium mb-3">{{ round.label }}</div>
                                        @for (match of round.matches; track match.id) {
                                            <div class="flex items-center gap-2 py-2 border-b border-surface last:border-0">
                                                <div class="flex-1 min-w-0">
                                                    <div class="flex justify-between gap-2">
                                                        <span class="truncate" [class.font-semibold]="match.home_score > match.away_score && match.status === 'finished'">
                                                            {{ match.home_team_name }}
                                                        </span>
                                                        <span class="tabular-nums">{{ match.status === 'finished' ? match.home_score : '' }}</span>
                                                    </div>
                                                    <div class="flex justify-between gap-2">
                                                        <span class="truncate" [class.font-semibold]="match.away_score > match.home_score && match.status === 'finished'">
                                                            {{ match.away_team_name }}
                                                        </span>
                                                        <span class="tabular-nums">{{ match.status === 'finished' ? match.away_score : '' }}</span>
                                                    </div>
                                                </div>
                                                <p-button icon="pi pi-chevron-right" [rounded]="true" [text]="true" size="small"
                                                          [routerLink]="['/pages/matches', match.id]" />
                                            </div>
                                        }
                                    </div>
                                </div>
                            }
                        </div>
                    </div>
                }
            }
        </div>
    `
})
export class TournamentSchedule implements OnInit {
    private readonly tournamentService = inject(TournamentService);
    private readonly matchService = inject(MatchService);
    private readonly catalogService = inject(CatalogService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly route = inject(ActivatedRoute);

    readonly tournament = signal<TournamentResponse | null>(null);
    readonly matchdays = signal<Matchday[]>([]);
    readonly bracket = signal<BracketRound[]>([]);
    readonly loading = signal(true);
    readonly working = signal(false);

    tournamentId!: number;

    ngOnInit() {
        this.tournamentId = Number(this.route.snapshot.params['id']);
        this.load();
    }

    load() {
        this.loading.set(true);
        forkJoin({
            tournament: this.tournamentService.getTournament(this.tournamentId),
            matches: this.matchService.getMatches({ tournament_id: this.tournamentId, stage: 'group' }),
            bracket: this.matchService.getBracket(this.tournamentId)
        }).subscribe({
            next: ({ tournament, matches, bracket }) => {
                this.tournament.set(tournament.data ?? null);
                this.matchdays.set(this.groupByRound(matches.data ?? []));
                this.bracket.set(bracket.data ?? []);
                this.loading.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el calendario.' });
                this.loading.set(false);
            }
        });
    }

    /** Matches arrive sorted by kickoff; this folds them into matchdays. */
    private groupByRound(matches: MatchResponse[]): Matchday[] {
        const byRound = new Map<number, MatchResponse[]>();
        for (const match of matches) {
            const round = match.round || 1;
            byRound.set(round, [...(byRound.get(round) ?? []), match]);
        }

        return [...byRound.entries()]
            .sort(([a], [b]) => a - b)
            .map(([round, roundMatches]) => ({
                round,
                date: roundMatches[0]?.estimated_start_time,
                matches: roundMatches
            }));
    }

    summary(): string {
        const t = this.tournament();
        if (!t) return '';

        const total = this.matchdays().reduce((sum, day) => sum + day.matches.length, 0);
        const parts = [
            `${this.matchdays().length} jornadas`,
            `${total} partidos`,
            t.double_round ? 'ida y vuelta' : 'solo ida'
        ];
        return parts.join(' · ');
    }

    statusLabel(status: string) {
        return this.catalogService.label('match_statuses', status);
    }

    tone(status: string) {
        return matchStatusSeverity(status);
    }

    generateFixtures() {
        this.working.set(true);
        this.tournamentService.generateFixtures(this.tournamentId).subscribe({
            next: (res) => {
                this.working.set(false);
                this.messageService.add({ severity: 'success', summary: 'Calendario listo', detail: res.message ?? '' });
                this.load();
            },
            error: (err) => {
                this.working.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'No se pudo generar',
                    detail: err.error?.message ?? 'Revisa que haya equipos inscritos y sedes registradas.'
                });
            }
        });
    }

    generateKnockout() {
        this.working.set(true);
        this.tournamentService.generateKnockout(this.tournamentId).subscribe({
            next: (res) => {
                this.working.set(false);
                this.messageService.add({ severity: 'success', summary: 'Llaves generadas', detail: res.message ?? '' });
                this.load();
            },
            error: (err) => {
                this.working.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'No se pudo generar',
                    detail: err.error?.message ?? 'Verifica que la fase anterior esté completa.'
                });
            }
        });
    }

    clear() {
        this.confirmationService.confirm({
            header: 'Borrar partidos programados',
            message: 'Se eliminarán solo los partidos que aún no se han jugado. Los resultados cargados se conservan. ¿Continuar?',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Borrar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.tournamentService.clearFixtures(this.tournamentId).subscribe({
                    next: (res) => {
                        this.messageService.add({ severity: 'success', summary: 'Listo', detail: res.message ?? '' });
                        this.load();
                    },
                    error: (err) =>
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? 'No se pudo borrar.' })
                });
            }
        });
    }
}
