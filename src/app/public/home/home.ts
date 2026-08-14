import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { forkJoin } from 'rxjs';
import { CatalogService } from '../../pages/service/catalog.service';
import { ConfigService } from '../../pages/service/config.service';
import { MatchResponse } from '../../pages/service/interfaces/match.interface';
import { TournamentResponse } from '../../pages/service/interfaces/tournament.interface';
import { MatchService } from '../../pages/service/match.service';
import { TournamentService } from '../../pages/service/tournament.service';
import { matchStatusSeverity, tournamentStatusSeverity } from '../../pages/shared/status';

/** Portal landing: what is being played, what is coming and where to look it up. */
@Component({
    selector: 'app-public-home',
    standalone: true,
    imports: [CommonModule, RouterModule, ButtonModule, TagModule],
    template: `
        <section class="mb-10">
            <h1 class="text-3xl md:text-4xl font-semibold m-0 mb-2">{{ config.platformName() }}</h1>
            <p class="text-muted-color text-lg m-0 max-w-2xl">
                Consulta el calendario, la tabla de posiciones y los goleadores de cada torneo. Sin cuenta, sin registro.
            </p>
        </section>

        @if (liveMatches().length > 0) {
            <section class="mb-10">
                <div class="flex items-center gap-2 mb-3">
                    <span class="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    <h2 class="text-lg font-semibold m-0">En vivo</h2>
                </div>
                <div class="grid grid-cols-12 gap-4">
                    @for (match of liveMatches(); track match.id) {
                        <div class="col-span-12 md:col-span-6">
                            <a [routerLink]="['/publico/partidos', match.id]"
                               class="block bg-surface-0 dark:bg-surface-900 border border-surface rounded-border p-4 no-underline text-inherit hover:border-primary transition-colors">
                                <div class="flex items-center justify-between gap-3">
                                    <span class="font-medium flex-1 text-right truncate">{{ match.home_team_name }}</span>
                                    <span class="text-2xl font-bold tabular-nums px-3">{{ match.home_score }} - {{ match.away_score }}</span>
                                    <span class="font-medium flex-1 truncate">{{ match.away_team_name }}</span>
                                </div>
                                <div class="text-center text-muted-color text-sm mt-2">{{ match.field_name }}</div>
                            </a>
                        </div>
                    }
                </div>
            </section>
        }

        <section class="mb-10">
            <h2 class="text-lg font-semibold mb-3">Torneos</h2>

            @if (loading()) {
                <div class="text-center py-10 text-muted-color"><i class="pi pi-spin pi-spinner text-2xl"></i></div>
            } @else if (tournaments().length === 0) {
                <div class="bg-surface-0 dark:bg-surface-900 border border-surface rounded-border p-10 text-center">
                    <i class="pi pi-trophy text-4xl text-muted-color mb-3 block"></i>
                    <span class="text-muted-color">Todavía no hay torneos publicados.</span>
                </div>
            } @else {
                <div class="grid grid-cols-12 gap-4">
                    @for (tournament of tournaments(); track tournament.id) {
                        <div class="col-span-12 md:col-span-6 lg:col-span-4">
                            <a [routerLink]="['/publico/torneos', tournament.id]"
                               class="flex flex-col h-full bg-surface-0 dark:bg-surface-900 border border-surface rounded-border p-5 no-underline text-inherit hover:border-primary transition-colors">
                                <div class="flex justify-between items-start gap-2 mb-2">
                                    <span class="font-semibold text-lg">{{ tournament.name }}</span>
                                    <p-tag [value]="statusLabel(tournament.status)" [severity]="statusTone(tournament.status)" styleClass="text-xs" />
                                </div>
                                <div class="text-muted-color text-sm mb-4">
                                    {{ typeLabel(tournament.type) }}{{ tournament.season ? ' · ' + tournament.season : '' }}
                                </div>
                                <div class="flex gap-4 text-sm text-muted-color mt-auto">
                                    <span><i class="pi pi-users mr-1"></i>{{ tournament.team_count || 0 }} equipos</span>
                                    @if (tournament.location) {
                                        <span class="truncate"><i class="pi pi-map-marker mr-1"></i>{{ tournament.location }}</span>
                                    }
                                </div>
                            </a>
                        </div>
                    }
                </div>
            }
        </section>

        @if (upcomingMatches().length > 0) {
            <section>
                <h2 class="text-lg font-semibold mb-3">Próximos partidos</h2>
                <div class="bg-surface-0 dark:bg-surface-900 border border-surface rounded-border overflow-hidden">
                    @for (match of upcomingMatches(); track match.id) {
                        <a [routerLink]="['/publico/partidos', match.id]"
                           class="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-surface last:border-0 no-underline text-inherit hover:bg-emphasis transition-colors">
                            <div class="text-center min-w-[4rem]">
                                <div class="text-xs font-bold text-primary uppercase">{{ match.estimated_start_time | date: 'MMM d' }}</div>
                                <div class="text-sm tabular-nums">{{ match.estimated_start_time | date: 'HH:mm' }}</div>
                            </div>
                            <span class="flex-1 text-right font-medium truncate min-w-[6rem]">{{ match.home_team_name }}</span>
                            <span class="text-muted-color text-sm">vs</span>
                            <span class="flex-1 font-medium truncate min-w-[6rem]">{{ match.away_team_name }}</span>
                            <span class="text-sm text-muted-color w-32 truncate hidden md:block">{{ match.field_name }}</span>
                        </a>
                    }
                </div>
            </section>
        }
    `
})
export class PublicHome implements OnInit {
    private readonly tournamentService = inject(TournamentService);
    private readonly matchService = inject(MatchService);
    private readonly catalogService = inject(CatalogService);
    readonly config = inject(ConfigService);

    readonly tournaments = signal<TournamentResponse[]>([]);
    readonly liveMatches = signal<MatchResponse[]>([]);
    readonly upcomingMatches = signal<MatchResponse[]>([]);
    readonly loading = signal(true);

    ngOnInit() {
        forkJoin({
            tournaments: this.tournamentService.getTournaments(),
            live: this.matchService.getMatches({ status: 'live' }),
            upcoming: this.matchService.getMatches({ status: 'upcoming', limit: 8 })
        }).subscribe({
            next: ({ tournaments, live, upcoming }) => {
                this.tournaments.set(tournaments.data ?? []);
                this.liveMatches.set(live.data ?? []);
                this.upcomingMatches.set(upcoming.data ?? []);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    statusLabel(status: string) {
        return this.catalogService.label('tournament_statuses', status);
    }

    typeLabel(type: string) {
        return this.catalogService.label('tournament_types', type);
    }

    statusTone(status: string) {
        return tournamentStatusSeverity(status);
    }

    matchTone(status: string) {
        return matchStatusSeverity(status);
    }
}
