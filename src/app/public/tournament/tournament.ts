import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CatalogService } from '../../pages/service/catalog.service';
import {
    BracketRound,
    MatchResponse,
    PlayerStatsResponse,
    StandingsResponse,
    SuspensionResponse
} from '../../pages/service/interfaces/match.interface';
import { TournamentResponse } from '../../pages/service/interfaces/tournament.interface';
import { MatchService } from '../../pages/service/match.service';
import { TournamentService } from '../../pages/service/tournament.service';
import { formResultClass, matchStatusSeverity, tournamentStatusSeverity } from '../../pages/shared/status';

interface Matchday {
    round: number;
    date: string;
    matches: MatchResponse[];
}

/** Everything a fan wants about one tournament: table, calendar, scorers, bracket. */
@Component({
    selector: 'app-public-tournament',
    standalone: true,
    imports: [CommonModule, RouterModule, TableModule, TagModule, TabsModule, ButtonModule],
    template: `
        @if (loading()) {
            <div class="text-center py-20 text-muted-color"><i class="pi pi-spin pi-spinner text-3xl"></i></div>
        } @else if (!tournament()) {
            <div class="text-center py-20">
                <i class="pi pi-exclamation-circle text-4xl text-muted-color mb-3 block"></i>
                <div class="text-muted-color mb-4">No encontramos ese torneo.</div>
                <p-button label="Ver todos" routerLink="/publico" />
            </div>
        } @else {
            <div class="flex flex-wrap items-start justify-between gap-4 mb-8">
                <div>
                    <a routerLink="/publico" class="text-muted-color text-sm no-underline"><i class="pi pi-arrow-left mr-1"></i>Torneos</a>
                    <h1 class="text-2xl md:text-3xl font-semibold mt-2 mb-1">{{ tournament()!.name }}</h1>
                    <div class="text-muted-color">
                        {{ typeLabel(tournament()!.type) }}
                        @if (tournament()!.season) { · {{ tournament()!.season }} }
                        @if (tournament()!.location) { · {{ tournament()!.location }} }
                    </div>
                </div>
                <p-tag [value]="statusLabel(tournament()!.status)" [severity]="statusTone(tournament()!.status)" />
            </div>

            <p-tabs value="standings">
                <p-tablist>
                    <p-tab value="standings">Tabla</p-tab>
                    <p-tab value="calendar">Calendario</p-tab>
                    @if (bracket().length > 0) { <p-tab value="bracket">Eliminatorias</p-tab> }
                    <p-tab value="scorers">Goleadores</p-tab>
                    @if (suspensions().length > 0) { <p-tab value="suspensions">Sancionados</p-tab> }
                </p-tablist>

                <p-tabpanels>
                    <!-- Tabla -->
                    <p-tabpanel value="standings">
                        @for (group of standings()?.groups ?? []; track group.group_name) {
                            <div class="mb-8 last:mb-0">
                                @if ((standings()?.groups ?? []).length > 1) {
                                    <div class="font-semibold text-lg mb-3">{{ group.group_name }}</div>
                                }
                                <p-table [value]="group.entries" responsiveLayout="scroll" styleClass="p-datatable-sm">
                                    <ng-template pTemplate="header">
                                        <tr>
                                            <th style="width: 3rem">#</th>
                                            <th>Equipo</th>
                                            <th class="text-center">PJ</th>
                                            <th class="text-center">G</th>
                                            <th class="text-center">E</th>
                                            <th class="text-center">P</th>
                                            <th class="text-center">GF</th>
                                            <th class="text-center">GC</th>
                                            <th class="text-center">DG</th>
                                            <th class="text-center">Racha</th>
                                            <th class="text-center">Pts</th>
                                        </tr>
                                    </ng-template>
                                    <ng-template pTemplate="body" let-entry>
                                        <tr>
                                            <td class="tabular-nums">
                                                <span class="inline-flex items-center gap-1">
                                                    {{ entry.position }}
                                                    @if (entry.is_advancing) {
                                                        <span class="w-1 h-4 bg-green-500 rounded-sm"></span>
                                                    }
                                                </span>
                                            </td>
                                            <td class="font-medium">{{ entry.team_name }}</td>
                                            <td class="text-center tabular-nums">{{ entry.matches_played }}</td>
                                            <td class="text-center tabular-nums">{{ entry.wins }}</td>
                                            <td class="text-center tabular-nums">{{ entry.draws }}</td>
                                            <td class="text-center tabular-nums">{{ entry.losses }}</td>
                                            <td class="text-center tabular-nums">{{ entry.goals_for }}</td>
                                            <td class="text-center tabular-nums">{{ entry.goals_against }}</td>
                                            <td class="text-center tabular-nums">{{ entry.goal_difference > 0 ? '+' : '' }}{{ entry.goal_difference }}</td>
                                            <td class="text-center">
                                                <span class="inline-flex gap-1">
                                                    @for (result of entry.form.split(''); track $index) {
                                                        <span class="inline-flex items-center justify-center rounded-sm text-[10px] font-bold"
                                                              style="width: 1.1rem; height: 1.1rem" [ngClass]="resultClass(result)">{{ result }}</span>
                                                    }
                                                </span>
                                            </td>
                                            <td class="text-center font-bold tabular-nums">{{ entry.points }}</td>
                                        </tr>
                                    </ng-template>
                                    <ng-template pTemplate="emptymessage">
                                        <tr><td colspan="11" class="text-center py-8 text-muted-color">Aún no hay resultados.</td></tr>
                                    </ng-template>
                                </p-table>
                            </div>
                        }
                    </p-tabpanel>

                    <!-- Calendario -->
                    <p-tabpanel value="calendar">
                        @for (day of matchdays(); track day.round) {
                            <div class="mb-6">
                                <div class="flex items-baseline justify-between mb-2">
                                    <div class="font-semibold">Jornada {{ day.round }}</div>
                                    <div class="text-muted-color text-sm">{{ day.date | date: 'EEEE d MMMM' }}</div>
                                </div>
                                <div class="border border-surface rounded-border overflow-hidden bg-surface-0 dark:bg-surface-900">
                                    @for (match of day.matches; track match.id) {
                                        <a [routerLink]="['/publico/partidos', match.id]"
                                           class="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-surface last:border-0 no-underline text-inherit hover:bg-emphasis transition-colors">
                                            <span class="text-sm tabular-nums text-muted-color w-12">{{ match.estimated_start_time | date: 'HH:mm' }}</span>
                                            <span class="flex-1 text-right font-medium truncate min-w-[6rem]">{{ match.home_team_name }}</span>
                                            @if (match.status === 'finished' || match.status === 'live') {
                                                <span class="font-bold tabular-nums px-2">{{ match.home_score }} - {{ match.away_score }}</span>
                                            } @else {
                                                <span class="text-muted-color text-sm px-2">vs</span>
                                            }
                                            <span class="flex-1 font-medium truncate min-w-[6rem]">{{ match.away_team_name }}</span>
                                            <p-tag [value]="matchStatusLabel(match.status)" [severity]="matchTone(match.status)" styleClass="text-xs" />
                                        </a>
                                    }
                                </div>
                            </div>
                        } @empty {
                            <div class="text-center py-12 text-muted-color">Todavía no hay calendario publicado.</div>
                        }
                    </p-tabpanel>

                    <!-- Eliminatorias -->
                    <p-tabpanel value="bracket">
                        <div class="grid grid-cols-12 gap-4">
                            @for (round of bracket(); track round.stage) {
                                <div class="col-span-12 md:col-span-6 xl:col-span-4">
                                    <div class="border border-surface rounded-border p-4 bg-surface-0 dark:bg-surface-900 h-full">
                                        <div class="font-medium mb-3">{{ round.label }}</div>
                                        @for (match of round.matches; track match.id) {
                                            <a [routerLink]="['/publico/partidos', match.id]"
                                               class="block py-2 border-b border-surface last:border-0 no-underline text-inherit">
                                                <div class="flex justify-between gap-2">
                                                    <span class="truncate" [class.font-semibold]="match.status === 'finished' && match.home_score > match.away_score">
                                                        {{ match.home_team_name }}
                                                    </span>
                                                    <span class="tabular-nums">{{ match.status === 'finished' ? match.home_score : '' }}</span>
                                                </div>
                                                <div class="flex justify-between gap-2">
                                                    <span class="truncate" [class.font-semibold]="match.status === 'finished' && match.away_score > match.home_score">
                                                        {{ match.away_team_name }}
                                                    </span>
                                                    <span class="tabular-nums">{{ match.status === 'finished' ? match.away_score : '' }}</span>
                                                </div>
                                            </a>
                                        }
                                    </div>
                                </div>
                            }
                        </div>
                    </p-tabpanel>

                    <!-- Goleadores -->
                    <p-tabpanel value="scorers">
                        <p-table [value]="scorers()" responsiveLayout="scroll" styleClass="p-datatable-sm"
                                 [rows]="15" [paginator]="scorers().length > 15">
                            <ng-template pTemplate="header">
                                <tr>
                                    <th style="width: 3rem">#</th>
                                    <th>Jugador</th>
                                    <th>Equipo</th>
                                    <th class="text-center">PJ</th>
                                    <th class="text-center">Goles</th>
                                    <th class="text-center">Asist.</th>
                                    <th class="text-center">TA</th>
                                    <th class="text-center">TR</th>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="body" let-player>
                                <tr>
                                    <td class="tabular-nums">{{ player.rank }}</td>
                                    <td>
                                        <a [routerLink]="['/publico/jugadores', player.player_id]"
                                           class="font-medium no-underline text-color hover:underline">
                                            {{ player.player_name }}
                                        </a>
                                    </td>
                                    <td class="text-muted-color">{{ player.team_name }}</td>
                                    <td class="text-center tabular-nums text-muted-color">{{ player.matches_played }}</td>
                                    <td class="text-center font-bold tabular-nums">{{ player.goals }}</td>
                                    <td class="text-center tabular-nums">{{ player.assists }}</td>
                                    <td class="text-center tabular-nums text-yellow-600">{{ player.yellows }}</td>
                                    <td class="text-center tabular-nums text-red-600">{{ player.reds }}</td>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="emptymessage">
                                <tr><td colspan="8" class="text-center py-8 text-muted-color">Sin goles registrados.</td></tr>
                            </ng-template>
                        </p-table>
                    </p-tabpanel>

                    <!-- Sancionados -->
                    <p-tabpanel value="suspensions">
                        <p-table [value]="suspensions()" responsiveLayout="scroll" styleClass="p-datatable-sm">
                            <ng-template pTemplate="header">
                                <tr>
                                    <th>Jugador</th>
                                    <th>Equipo</th>
                                    <th>Motivo</th>
                                    <th class="text-center">Partidos</th>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="body" let-suspension>
                                <tr>
                                    <td class="font-medium">{{ suspension.player_name }}</td>
                                    <td class="text-muted-color">{{ suspension.team_name }}</td>
                                    <td class="text-sm">{{ suspension.reason }}</td>
                                    <td class="text-center tabular-nums">{{ suspension.matches_served }} / {{ suspension.matches_count }}</td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </p-tabpanel>
                </p-tabpanels>
            </p-tabs>
        }
    `
})
export class PublicTournament implements OnInit {
    private readonly tournamentService = inject(TournamentService);
    private readonly matchService = inject(MatchService);
    private readonly catalogService = inject(CatalogService);
    private readonly route = inject(ActivatedRoute);

    readonly tournament = signal<TournamentResponse | null>(null);
    readonly standings = signal<StandingsResponse | null>(null);
    readonly matchdays = signal<Matchday[]>([]);
    readonly bracket = signal<BracketRound[]>([]);
    readonly playerStats = signal<PlayerStatsResponse[]>([]);
    readonly suspensions = signal<SuspensionResponse[]>([]);
    readonly loading = signal(true);

    ngOnInit() {
        const id = Number(this.route.snapshot.params['id']);

        forkJoin({
            tournament: this.tournamentService.getTournament(id).pipe(catchError(() => of({ data: null }))),
            standings: this.matchService.getStandings(id).pipe(catchError(() => of({ data: null }))),
            matches: this.matchService.getMatches({ tournament_id: id, stage: 'group' }).pipe(catchError(() => of({ data: [] }))),
            bracket: this.matchService.getBracket(id).pipe(catchError(() => of({ data: [] }))),
            stats: this.matchService.getPlayerStats(id).pipe(catchError(() => of({ data: [] }))),
            suspensions: this.matchService.getPublicSuspensions(id).pipe(catchError(() => of({ data: [] })))
        }).subscribe(({ tournament, standings, matches, bracket, stats, suspensions }) => {
            this.tournament.set(tournament.data as TournamentResponse | null);
            this.standings.set(standings.data as StandingsResponse | null);
            this.matchdays.set(this.groupByRound((matches.data ?? []) as MatchResponse[]));
            this.bracket.set((bracket.data ?? []) as BracketRound[]);
            this.playerStats.set((stats.data ?? []) as PlayerStatsResponse[]);
            this.suspensions.set((suspensions.data ?? []) as SuspensionResponse[]);
            this.loading.set(false);
        });
    }

    private groupByRound(matches: MatchResponse[]): Matchday[] {
        const byRound = new Map<number, MatchResponse[]>();
        for (const match of matches) {
            const round = match.round || 1;
            byRound.set(round, [...(byRound.get(round) ?? []), match]);
        }
        return [...byRound.entries()]
            .sort(([a], [b]) => a - b)
            .map(([round, roundMatches]) => ({ round, date: roundMatches[0]?.estimated_start_time, matches: roundMatches }));
    }

    scorers(): PlayerStatsResponse[] {
        return this.playerStats().filter((player) => player.goals > 0);
    }

    statusLabel(status: string) {
        return this.catalogService.label('tournament_statuses', status);
    }

    typeLabel(type: string) {
        return this.catalogService.label('tournament_types', type);
    }

    matchStatusLabel(status: string) {
        return this.catalogService.label('match_statuses', status);
    }

    statusTone(status: string) {
        return tournamentStatusSeverity(status);
    }

    matchTone(status: string) {
        return matchStatusSeverity(status);
    }

    resultClass(result: string) {
        return formResultClass(result);
    }
}
