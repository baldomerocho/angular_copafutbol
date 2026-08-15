import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CatalogService } from '../../pages/service/catalog.service';
import { MatchResponse, StandingsEntry } from '../../pages/service/interfaces/match.interface';
import { RosterEntryResponse, TeamResponse } from '../../pages/service/interfaces/team.interface';
import { MatchService } from '../../pages/service/match.service';
import { TeamService } from '../../pages/service/team.service';
import { matchStatusSeverity } from '../../pages/shared/status';

/**
 * A team's public page: who they are, who plays for them, and how their season is
 * going. Reachable from the table and from any match sheet, which is where a
 * visitor actually wonders about a team.
 */
@Component({
    selector: 'app-public-team',
    standalone: true,
    imports: [CommonModule, RouterModule, TagModule, ButtonModule, TableModule, TabsModule, TooltipModule],
    template: `
        @if (loading()) {
            <div class="text-center py-20 text-muted-color"><i class="pi pi-spin pi-spinner text-3xl"></i></div>
        } @else if (!team()) {
            <div class="text-center py-20">
                <i class="pi pi-exclamation-circle text-4xl text-muted-color mb-3 block"></i>
                <div class="text-muted-color mb-4">No encontramos ese equipo.</div>
                <p-button label="Volver al inicio" routerLink="/publico" />
            </div>
        } @else {
            @if (team()!.tournament_id) {
                <a [routerLink]="['/publico/torneos', team()!.tournament_id]" class="text-muted-color text-sm no-underline">
                    <i class="pi pi-arrow-left mr-1"></i>{{ team()!.tournament?.name }}
                </a>
            }

            <!-- Cabecera -->
            <div class="bg-surface-0 dark:bg-surface-900 border border-surface rounded-border p-6 md:p-8 mt-4 mb-6">
                <div class="flex flex-wrap items-center gap-6">
                    <div class="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold">
                        {{ initials() }}
                    </div>

                    <div class="flex-1 min-w-0">
                        <h1 class="text-2xl md:text-3xl font-bold m-0">{{ team()!.name }}</h1>
                        <div class="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-color">
                            @if (team()!.club?.name) {
                                <span><i class="pi pi-building mr-1"></i>{{ team()!.club!.name }}</span>
                            }
                            @if (team()!.division) {
                                <span>· {{ team()!.division }}</span>
                            }
                            <span>· {{ team()!.player_count }} jugadores</span>
                        </div>
                    </div>

                    @if (position(); as row) {
                        <div class="flex gap-6 md:gap-8">
                            <div class="text-center">
                                <div class="text-3xl font-bold tabular-nums">{{ row.position }}º</div>
                                <div class="text-muted-color text-xs uppercase tracking-wide mt-1">Posición</div>
                            </div>
                            <div class="text-center">
                                <div class="text-3xl font-bold tabular-nums">{{ row.points }}</div>
                                <div class="text-muted-color text-xs uppercase tracking-wide mt-1">Puntos</div>
                            </div>
                            <div class="text-center">
                                <div class="text-3xl font-bold tabular-nums">{{ row.wins }}-{{ row.draws }}-{{ row.losses }}</div>
                                <div class="text-muted-color text-xs uppercase tracking-wide mt-1">G-E-P</div>
                            </div>
                        </div>
                    }
                </div>
            </div>

            <p-tabs value="matches">
                <p-tablist>
                    <p-tab value="matches">Partidos</p-tab>
                    <p-tab value="squad">Plantilla</p-tab>
                </p-tablist>

                <p-tabpanels>
                    <p-tabpanel value="matches">
                        <p-table [value]="matches()" responsiveLayout="scroll" styleClass="p-datatable-sm"
                                 [rows]="20" [paginator]="matches().length > 20">
                            <ng-template pTemplate="header">
                                <tr>
                                    <th style="width: 9rem">Fecha</th>
                                    <th>Rival</th>
                                    <th class="text-center cursor-help" style="width: 6rem"
                                        pTooltip="Marcador visto desde este equipo: primero sus goles"
                                        tooltipPosition="top">Resultado</th>
                                    <th style="width: 7rem">Estado</th>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="body" let-match>
                                <tr>
                                    <td class="text-sm whitespace-nowrap">
                                        {{ match.estimated_start_time | date: 'dd MMM · HH:mm' }}
                                    </td>
                                    <td>
                                        <a [routerLink]="['/publico/partidos', match.id]"
                                           class="no-underline text-color hover:underline">
                                            <span class="text-muted-color text-xs mr-1">{{ isHome(match) ? 'vs' : '@' }}</span>
                                            <span class="font-medium">{{ opponent(match) }}</span>
                                        </a>
                                        <div class="text-muted-color text-xs">{{ match.field_name }}</div>
                                    </td>
                                    <td class="text-center font-bold tabular-nums">
                                        @if (match.status === 'finished' || match.status === 'live') {
                                            <span class="cursor-help"
                                                  [class.text-green-600]="outcome(match) === 'W'"
                                                  [class.text-red-500]="outcome(match) === 'L'"
                                                  [pTooltip]="outcomeLabel(match)" tooltipPosition="top">
                                                {{ ourGoals(match) }} - {{ theirGoals(match) }}
                                            </span>
                                        } @else {
                                            <span class="text-muted-color">—</span>
                                        }
                                    </td>
                                    <td>
                                        <p-tag [value]="statusLabel(match.status)" [severity]="tone(match.status)" styleClass="text-xs" />
                                    </td>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="emptymessage">
                                <tr><td colspan="4" class="text-center py-8 text-muted-color">Sin partidos programados.</td></tr>
                            </ng-template>
                        </p-table>
                    </p-tabpanel>

                    <p-tabpanel value="squad">
                        <p-table [value]="roster()" responsiveLayout="scroll" styleClass="p-datatable-sm"
                                 [rows]="30" [paginator]="roster().length > 30">
                            <ng-template pTemplate="header">
                                <tr>
                                    <th style="width: 5rem" class="text-center">Dorsal</th>
                                    <th>Jugador</th>
                                    <th>Posición</th>
                                    <th style="width: 8rem">Estado</th>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="body" let-entry>
                                <tr>
                                    <td class="text-center tabular-nums font-bold">{{ entry.number }}</td>
                                    <td>
                                        <a [routerLink]="['/publico/jugadores', entry.player_id]"
                                           class="font-medium no-underline text-color hover:underline">
                                            {{ entry.player.name }}
                                        </a>
                                        @if (entry.is_captain) {
                                            <span class="text-primary text-xs ml-2">Capitán</span>
                                        }
                                    </td>
                                    <td class="text-sm">{{ entry.position ? positionLabel(entry.position) : '—' }}</td>
                                    <td>
                                        @if (entry.suspended) {
                                            <p-tag value="Suspendido" severity="danger" styleClass="text-xs" />
                                        } @else if (!entry.eligible) {
                                            <p-tag value="No habilitado" severity="warn" styleClass="text-xs" />
                                        } @else {
                                            <p-tag value="Disponible" severity="success" styleClass="text-xs" />
                                        }
                                    </td>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="emptymessage">
                                <tr><td colspan="4" class="text-center py-8 text-muted-color">Sin plantilla publicada.</td></tr>
                            </ng-template>
                        </p-table>
                    </p-tabpanel>
                </p-tabpanels>
            </p-tabs>
        }
    `
})
export class PublicTeam implements OnInit {
    private readonly teamService = inject(TeamService);
    private readonly matchService = inject(MatchService);
    private readonly catalogService = inject(CatalogService);
    private readonly route = inject(ActivatedRoute);

    readonly team = signal<TeamResponse | null>(null);
    readonly roster = signal<RosterEntryResponse[]>([]);
    readonly matches = signal<MatchResponse[]>([]);
    readonly position = signal<StandingsEntry | null>(null);
    readonly loading = signal(true);

    private teamId = 0;

    ngOnInit() {
        this.teamId = Number(this.route.snapshot.params['id']);

        // The squad and the fixtures are independent of each other; a team with no
        // matches yet should still show its players.
        forkJoin({
            team: this.teamService.getPublicTeam(this.teamId).pipe(catchError(() => of({ data: null }))),
            roster: this.teamService.getRoster(this.teamId).pipe(catchError(() => of({ data: [] }))),
            matches: this.matchService.getMatches({ team_id: this.teamId }).pipe(catchError(() => of({ data: [] })))
        }).subscribe(({ team, roster, matches }) => {
            this.team.set((team.data as TeamResponse) ?? null);
            this.roster.set((roster.data as RosterEntryResponse[]) ?? []);
            this.matches.set((matches.data as MatchResponse[]) ?? []);
            this.loading.set(false);
            this.loadPosition();
        });
    }

    /** The team's row in its group, so the header can lead with where they stand. */
    private loadPosition() {
        const tournamentId = this.team()?.tournament_id;
        if (!tournamentId) return;

        this.matchService.getStandings(tournamentId).subscribe({
            next: (res) => {
                for (const group of res.data?.groups ?? []) {
                    const row = (group.entries ?? []).find((entry: StandingsEntry) => entry.team_id === this.teamId);
                    if (row) {
                        this.position.set(row);
                        return;
                    }
                }
            }
        });
    }

    initials(): string {
        return (this.team()?.name ?? '?')
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((word) => word[0].toUpperCase())
            .join('');
    }

    positionLabel(position: string): string {
        return this.catalogService.label('player_positions', position);
    }

    statusLabel(status: string): string {
        return this.catalogService.label('match_statuses', status);
    }

    tone(status: string) {
        return matchStatusSeverity(status);
    }

    isHome(match: MatchResponse): boolean {
        return match.home_team_id === this.teamId;
    }

    opponent(match: MatchResponse): string {
        return this.isHome(match) ? match.away_team_name : match.home_team_name;
    }

    ourGoals(match: MatchResponse): number {
        return this.isHome(match) ? match.home_score : match.away_score;
    }

    theirGoals(match: MatchResponse): number {
        return this.isHome(match) ? match.away_score : match.home_score;
    }

    /** Spells out the coloured score, which reads as decoration otherwise. */
    outcomeLabel(match: MatchResponse): string {
        const result = this.outcome(match);
        const live = match.status === 'live' ? ' (en juego)' : '';
        if (result === 'W') return `Victoria${live}`;
        if (result === 'L') return `Derrota${live}`;
        return `Empate${live}`;
    }

    /** Colours the score from this team's side, which is the whole point of a team page. */
    outcome(match: MatchResponse): 'W' | 'D' | 'L' {
        const ours = this.ourGoals(match);
        const theirs = this.theirGoals(match);
        if (ours > theirs) return 'W';
        if (ours < theirs) return 'L';
        return 'D';
    }
}
