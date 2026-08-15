import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin } from 'rxjs';
import { CatalogService } from '../../service/catalog.service';
import { PlayerStatsResponse, StandingsResponse } from '../../service/interfaces/match.interface';
import { MatchService } from '../../service/match.service';
import { downloadCsv, slugify } from '../../shared/csv';
import { formResultClass } from '../../shared/status';

/** The live table, built from the tournament's own points and tiebreaker rules. */
@Component({
    selector: 'app-tournament-standings',
    standalone: true,
    imports: [CommonModule, RouterModule, TableModule, TagModule, ToastModule, ButtonModule, TooltipModule, TabsModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="card">
            <div class="flex flex-wrap justify-between items-start gap-4 mb-6">
                <div>
                    <h1 class="text-xl font-semibold m-0">Tabla de posiciones</h1>
                    <p class="text-muted-color text-sm mt-1 mb-0">{{ standings()?.tournament_name }} · {{ rulesSummary() }}</p>
                </div>
                <div class="flex gap-2">
                    <p-button label="Exportar tabla" icon="pi pi-download" severity="secondary" [outlined]="true"
                              (onClick)="exportStandings()" />
                    <p-button label="Exportar goleadores" icon="pi pi-download" severity="secondary" [outlined]="true"
                              (onClick)="exportScorers()" />
                    <p-button label="Actualizar" icon="pi pi-refresh" severity="secondary" [text]="true" (onClick)="load()" />
                </div>
            </div>

            @if (loading()) {
                <div class="text-center py-10 text-muted-color"><i class="pi pi-spin pi-spinner text-2xl"></i></div>
            } @else {
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
                                    <th class="text-center" pTooltip="Partidos jugados">PJ</th>
                                    <th class="text-center" pTooltip="Ganados">G</th>
                                    <th class="text-center" pTooltip="Empatados">E</th>
                                    <th class="text-center" pTooltip="Perdidos">P</th>
                                    <th class="text-center" pTooltip="Goles a favor">GF</th>
                                    <th class="text-center" pTooltip="Goles en contra">GC</th>
                                    <th class="text-center" pTooltip="Diferencia de goles">DG</th>
                                    <th class="text-center" pTooltip="Tarjetas">TA/TR</th>
                                    <th class="text-center">Racha</th>
                                    <th class="text-center">Pts</th>
                                </tr>
                            </ng-template>

                            <ng-template pTemplate="body" let-entry>
                                <tr [ngClass]="entry.is_advancing ? 'bg-green-50 dark:bg-green-500/10' : ''">
                                    <td class="tabular-nums">
                                        <span class="inline-flex items-center gap-1">
                                            {{ entry.position }}
                                            @if (entry.is_advancing) {
                                                <span class="w-1 h-4 bg-green-500 rounded-sm" title="Zona de clasificación"></span>
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
                                    <td class="text-center text-sm">
                                        <span class="text-yellow-600">{{ entry.yellow_cards }}</span>
                                        <span class="text-muted-color mx-1">/</span>
                                        <span class="text-red-600">{{ entry.red_cards }}</span>
                                    </td>
                                    <td class="text-center">
                                        <span class="inline-flex gap-1">
                                            @for (result of entry.form.split(''); track $index) {
                                                <span class="inline-flex items-center justify-center rounded-sm text-[10px] font-bold"
                                                      style="width: 1.1rem; height: 1.1rem"
                                                      [ngClass]="resultClass(result)">{{ result }}</span>
                                            }
                                        </span>
                                    </td>
                                    <td class="text-center font-bold tabular-nums">{{ entry.points }}</td>
                                </tr>
                            </ng-template>

                            <ng-template pTemplate="emptymessage">
                                <tr><td colspan="12" class="text-center py-6 text-muted-color">Sin resultados cargados todavía.</td></tr>
                            </ng-template>
                        </p-table>
                    </div>
                }
            }
        </div>

        <div class="card">
            <div class="font-semibold text-lg mb-4">Estadísticas de jugadores</div>

            <p-tabs value="scorers">
                <p-tablist>
                    <p-tab value="scorers">Goleadores</p-tab>
                    <p-tab value="cards">Tarjetas</p-tab>
                </p-tablist>
                <p-tabpanels>
                    <p-tabpanel value="scorers">
                        <p-table [value]="scorers()" responsiveLayout="scroll" styleClass="p-datatable-sm" [rows]="10" [paginator]="scorers().length > 10">
                            <ng-template pTemplate="header">
                                <tr>
                                    <th style="width: 3rem">#</th>
                                    <th>Jugador</th>
                                    <th>Equipo</th>
                                    <th class="text-center" pTooltip="Partidos jugados" tooltipPosition="top">PJ</th>
                                    <th class="text-center">Goles</th>
                                    <th class="text-center" pTooltip="De penal" tooltipPosition="top">(P)</th>
                                    <th class="text-center">Asist.</th>
                                    <th class="text-center" pTooltip="Goles por partido" tooltipPosition="top">G/PJ</th>
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
                                        <span class="text-muted-color text-sm">#{{ player.player_number }}</span>
                                        @if (player.suspended) {
                                            <i class="pi pi-ban text-red-500 text-xs ml-2" pTooltip="Sancionado" tooltipPosition="top"></i>
                                        }
                                    </td>
                                    <td>{{ player.team_name }}</td>
                                    <td class="text-center tabular-nums text-muted-color">{{ player.matches_played }}</td>
                                    <td class="text-center font-bold tabular-nums">{{ player.goals }}</td>
                                    <td class="text-center tabular-nums text-muted-color">
                                        {{ player.penalty_goals || '—' }}
                                    </td>
                                    <td class="text-center tabular-nums">{{ player.assists }}</td>
                                    <td class="text-center tabular-nums text-muted-color">{{ player.goals_per_match }}</td>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="emptymessage">
                                <tr><td colspan="8" class="text-center py-6 text-muted-color">Sin goles registrados.</td></tr>
                            </ng-template>
                        </p-table>
                    </p-tabpanel>

                    <p-tabpanel value="cards">
                        <p-table [value]="booked()" responsiveLayout="scroll" styleClass="p-datatable-sm" [rows]="10" [paginator]="booked().length > 10">
                            <ng-template pTemplate="header">
                                <tr>
                                    <th>Jugador</th>
                                    <th>Equipo</th>
                                    <th class="text-center">Amarillas</th>
                                    <th class="text-center">Rojas</th>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="body" let-player>
                                <tr>
                                    <td class="font-medium">{{ player.player_name }}</td>
                                    <td>{{ player.team_name }}</td>
                                    <td class="text-center tabular-nums text-yellow-600 font-semibold">{{ player.yellows }}</td>
                                    <td class="text-center tabular-nums text-red-600 font-semibold">{{ player.reds }}</td>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="emptymessage">
                                <tr><td colspan="4" class="text-center py-6 text-muted-color">Sin tarjetas registradas.</td></tr>
                            </ng-template>
                        </p-table>
                    </p-tabpanel>
                </p-tabpanels>
            </p-tabs>
        </div>
    `
})
export class TournamentStandings implements OnInit {
    private readonly matchService = inject(MatchService);
    private readonly catalogService = inject(CatalogService);
    private readonly messageService = inject(MessageService);
    private readonly route = inject(ActivatedRoute);

    readonly standings = signal<StandingsResponse | null>(null);
    readonly playerStats = signal<PlayerStatsResponse[]>([]);
    readonly loading = signal(true);

    tournamentId!: number;

    ngOnInit() {
        this.tournamentId = Number(this.route.snapshot.params['id']);
        this.load();
    }

    load() {
        this.loading.set(true);
        forkJoin({
            standings: this.matchService.getStandings(this.tournamentId),
            stats: this.matchService.getPlayerStats(this.tournamentId)
        }).subscribe({
            next: ({ standings, stats }) => {
                this.standings.set(standings.data ?? null);
                this.playerStats.set(stats.data ?? []);
                this.loading.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la tabla.' });
                this.loading.set(false);
            }
        });
    }

    private fileName(what: string): string {
        return `${slugify(this.standings()?.tournament_name ?? 'torneo')}-${what}`;
    }

    exportStandings() {
        const rows: unknown[][] = [];
        for (const group of this.standings()?.groups ?? []) {
            for (const entry of group.entries ?? []) {
                rows.push([
                    group.group_name ?? '',
                    entry.position,
                    entry.team_name,
                    entry.matches_played,
                    entry.wins,
                    entry.draws,
                    entry.losses,
                    entry.goals_for,
                    entry.goals_against,
                    entry.goal_difference,
                    entry.points
                ]);
            }
        }
        downloadCsv(this.fileName('tabla'),
            ['Grupo', 'Pos', 'Equipo', 'PJ', 'G', 'E', 'P', 'GF', 'GC', 'DG', 'Pts'], rows);
    }

    exportScorers() {
        downloadCsv(
            this.fileName('goleadores'),
            ['Pos', 'Jugador', 'Dorsal', 'Equipo', 'PJ', 'Goles', 'De penal', 'Asistencias', 'G/PJ', 'Amarillas', 'Rojas'],
            this.scorers().map((player) => [
                player.rank,
                player.player_name,
                player.player_number,
                player.team_name,
                player.matches_played,
                player.goals,
                player.penalty_goals,
                player.assists,
                player.goals_per_match,
                player.yellows,
                player.reds
            ])
        );
    }

    scorers(): PlayerStatsResponse[] {
        return this.playerStats().filter((player) => player.goals > 0);
    }

    booked(): PlayerStatsResponse[] {
        return this.playerStats()
            .filter((player) => player.yellows > 0 || player.reds > 0)
            .sort((a, b) => b.reds - a.reds || b.yellows - a.yellows);
    }

    rulesSummary(): string {
        const data = this.standings();
        if (!data) return '';

        const tiebreakers = (data.tiebreakers ?? []).map((id) => this.catalogService.label('tiebreakers', id)).join(' → ');
        return `${data.points_win} pts por victoria, ${data.points_draw} por empate` + (tiebreakers ? ` · desempate: ${tiebreakers}` : '');
    }

    resultClass(result: string): string {
        return formResultClass(result);
    }
}
