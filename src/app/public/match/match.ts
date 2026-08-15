import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CatalogService } from '../../pages/service/catalog.service';
import { LineupResponse, MatchEventResponse, MatchResponse } from '../../pages/service/interfaces/match.interface';
import { MatchService } from '../../pages/service/match.service';
import { eventTypeSeverity, matchStatusSeverity } from '../../pages/shared/status';

/** Public match sheet: score, timeline and the two lineups. */
@Component({
    selector: 'app-public-match',
    standalone: true,
    imports: [CommonModule, RouterModule, TagModule, ButtonModule],
    template: `
        @if (loading()) {
            <div class="text-center py-20 text-muted-color"><i class="pi pi-spin pi-spinner text-3xl"></i></div>
        } @else if (!match()) {
            <div class="text-center py-20">
                <i class="pi pi-exclamation-circle text-4xl text-muted-color mb-3 block"></i>
                <div class="text-muted-color mb-4">No encontramos ese partido.</div>
                <p-button label="Volver al inicio" routerLink="/publico" />
            </div>
        } @else {
            <a [routerLink]="['/publico/torneos', match()!.tournament_id]" class="text-muted-color text-sm no-underline">
                <i class="pi pi-arrow-left mr-1"></i>Volver al torneo
            </a>

            <div class="bg-surface-0 dark:bg-surface-900 border border-surface rounded-border p-6 md:p-8 mt-4 mb-6">
                <div class="flex justify-center mb-4">
                    <p-tag [value]="statusLabel()" [severity]="statusTone()" />
                </div>

                <div class="flex items-center justify-center gap-6 md:gap-12">
                    <div class="text-center flex-1">
                        <div class="font-semibold text-lg md:text-2xl">{{ match()!.home_team_name }}</div>
                    </div>
                    <div class="text-center">
                        <div class="text-4xl md:text-6xl font-bold tabular-nums">
                            {{ match()!.home_score }} <span class="text-muted-color">-</span> {{ match()!.away_score }}
                        </div>
                    </div>
                    <div class="text-center flex-1">
                        <div class="font-semibold text-lg md:text-2xl">{{ match()!.away_team_name }}</div>
                    </div>
                </div>

                <div class="text-center text-muted-color text-sm mt-5">
                    {{ match()!.estimated_start_time | date: 'EEEE d MMMM · HH:mm' }}
                    @if (match()!.field_name) { · {{ match()!.field_name }} }
                    @if (match()!.group_name) { · {{ match()!.group_name }} }
                </div>
            </div>

            <div class="grid grid-cols-12 gap-6">
                <div class="col-span-12 lg:col-span-7">
                    <div class="bg-surface-0 dark:bg-surface-900 border border-surface rounded-border p-5 h-full">
                        <div class="font-semibold mb-4">Cronología</div>

                        @if (events().length === 0) {
                            <div class="text-center py-10 text-muted-color">Sin eventos registrados.</div>
                        } @else {
                            <ul class="list-none p-0 m-0">
                                @for (event of events(); track event.id) {
                                    <li class="flex items-center gap-3 py-2.5 border-b border-surface last:border-0">
                                        <span class="tabular-nums text-sm font-medium text-muted-color w-9">{{ event.minute }}'</span>
                                        <p-tag [value]="eventLabel(event.type)" [severity]="eventTone(event.type)" styleClass="text-xs" />
                                        <div class="flex-1 min-w-0">
                                            <div class="truncate">{{ event.player_name || event.team_name }}</div>
                                            <div class="text-muted-color text-sm truncate">{{ event.team_name }}</div>
                                        </div>
                                    </li>
                                }
                            </ul>
                        }
                    </div>
                </div>

                <div class="col-span-12 lg:col-span-5">
                    <div class="bg-surface-0 dark:bg-surface-900 border border-surface rounded-border p-5 h-full">
                        <div class="font-semibold mb-4">Alineaciones</div>

                        @if (lineups().length === 0) {
                            <div class="text-center py-10 text-muted-color">Sin alineaciones publicadas.</div>
                        } @else {
                            @for (side of ['home', 'away']; track side) {
                                <div class="mb-5 last:mb-0">
                                    <div class="text-sm font-medium text-muted-color uppercase tracking-wide mb-2">
                                        {{ side === 'home' ? match()!.home_team_name : match()!.away_team_name }}
                                    </div>
                                    <ul class="list-none p-0 m-0">
                                        @for (entry of lineupFor(side); track entry.player_id) {
                                            <li class="flex items-center gap-3 py-1.5">
                                                <span class="tabular-nums text-sm text-muted-color w-6">{{ entry.player_number }}</span>
                                                <span class="flex-1 truncate">{{ entry.player_name }}</span>
                                                <span class="text-muted-color text-xs">{{ entry.position }}</span>
                                            </li>
                                        } @empty {
                                            <li class="text-muted-color text-sm py-1.5">Sin alineación.</li>
                                        }
                                    </ul>
                                </div>
                            }
                        }
                    </div>
                </div>
            </div>
        }
    `
})
export class PublicMatch implements OnInit, OnDestroy {
    private readonly matchService = inject(MatchService);
    private readonly catalogService = inject(CatalogService);
    private readonly route = inject(ActivatedRoute);

    readonly match = signal<MatchResponse | null>(null);
    readonly events = signal<MatchEventResponse[]>([]);
    readonly lineups = signal<LineupResponse[]>([]);
    readonly loading = signal(true);

    private matchId = 0;
    private liveTimer?: ReturnType<typeof setInterval>;

    ngOnInit() {
        this.matchId = Number(this.route.snapshot.params['id']);
        this.load();
    }

    ngOnDestroy() {
        clearInterval(this.liveTimer);
    }

    private load() {
        this.matchService.getMatch(this.matchId).subscribe({
            next: (res) => {
                this.match.set(res.data?.match ?? null);
                this.events.set(res.data?.events ?? []);
                this.lineups.set(res.data?.lineups ?? []);
                this.loading.set(false);
                this.watchWhileLive();
            },
            error: () => this.loading.set(false)
        });
    }

    /**
     * Re-reads the sheet while the match is being played, so the score and the
     * timeline follow along without a reload. Polling rather than a socket: the
     * page is read for a couple of hours at most and this needs nothing special
     * from the tunnel or any proxy in front of it. Stops as soon as the match is
     * no longer live.
     */
    private watchWhileLive() {
        clearInterval(this.liveTimer);
        if (this.match()?.status !== 'live') return;

        this.liveTimer = setInterval(() => this.load(), 20_000);
    }

    lineupFor(side: string): LineupResponse[] {
        const match = this.match();
        if (!match) return [];
        const teamId = side === 'home' ? match.home_team_id : match.away_team_id;
        return this.lineups().filter((entry) => entry.team_id === teamId);
    }

    statusLabel() {
        return this.catalogService.label('match_statuses', this.match()?.status);
    }

    statusTone() {
        return matchStatusSeverity(this.match()?.status);
    }

    eventLabel(type: string) {
        return this.catalogService.label('match_event_types', type);
    }

    eventTone(type: string) {
        return eventTypeSeverity(type);
    }
}
