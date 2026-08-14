import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin } from 'rxjs';
import { CatalogService } from '../../service/catalog.service';
import { MatchResponse } from '../../service/interfaces/match.interface';
import { MatchService } from '../../service/match.service';
import { matchStatusSeverity } from '../../shared/status';

/** Anything being played right now, followed by the next kickoffs. */
@Component({
    standalone: true,
    selector: 'app-matches-widget',
    imports: [CommonModule, RouterModule, ButtonModule, TagModule, TooltipModule],
    template: `
        <div class="card">
            <div class="flex justify-between items-center mb-6">
                <div class="font-semibold text-xl">Próximos partidos</div>
                <a routerLink="/pages/matches" class="text-primary text-sm font-medium">Ver calendario</a>
            </div>

            @if (loading()) {
                <div class="text-center py-8 text-muted-color"><i class="pi pi-spin pi-spinner text-2xl"></i></div>
            } @else if (matches().length === 0) {
                <div class="text-center py-10">
                    <i class="pi pi-calendar-times text-4xl text-muted-color mb-3 block"></i>
                    <span class="text-muted-color">No hay partidos programados.</span>
                </div>
            } @else {
                <ul class="list-none p-0 m-0">
                    @for (match of matches(); track match.id) {
                        <li class="flex flex-col md:flex-row md:items-center gap-4 p-3 border-b border-surface last:border-0 hover:bg-emphasis transition-colors">
                            <div class="text-center md:min-w-[5rem]">
                                <div class="text-sm font-bold text-primary uppercase">{{ match.estimated_start_time | date: 'MMM d' }}</div>
                                <div class="text-lg font-medium tabular-nums">{{ match.estimated_start_time | date: 'HH:mm' }}</div>
                            </div>

                            <div class="flex-1 flex items-center justify-center gap-3 min-w-0">
                                <span class="font-semibold flex-1 text-right truncate">{{ match.home_team_name }}</span>
                                @if (match.status === 'finished' || match.status === 'live') {
                                    <span class="font-bold text-xl tabular-nums px-2">{{ match.home_score }} - {{ match.away_score }}</span>
                                } @else {
                                    <span class="text-muted-color text-sm px-2">vs</span>
                                }
                                <span class="font-semibold flex-1 truncate">{{ match.away_team_name }}</span>
                            </div>

                            <div class="flex items-center gap-3 justify-between md:justify-end md:min-w-[14rem]">
                                <span class="text-sm text-muted-color truncate">{{ match.field_name || 'Sede por definir' }}</span>
                                <p-tag [value]="statusLabel(match.status)" [severity]="severity(match.status)" styleClass="text-xs" />
                                <p-button icon="pi pi-chevron-right" [rounded]="true" [text]="true"
                                          pTooltip="Abrir planilla" tooltipPosition="left"
                                          [routerLink]="['/pages/matches', match.id]" />
                            </div>
                        </li>
                    }
                </ul>
            }
        </div>
    `
})
export class MatchesWidget implements OnInit {
    private readonly matchService = inject(MatchService);
    private readonly catalogService = inject(CatalogService);

    readonly matches = signal<MatchResponse[]>([]);
    readonly loading = signal(true);

    ngOnInit() {
        forkJoin({
            live: this.matchService.getMatches({ status: 'live' }),
            upcoming: this.matchService.getMatches({ status: 'upcoming', limit: 6 })
        }).subscribe({
            next: ({ live, upcoming }) => {
                this.matches.set([...(live.data ?? []), ...(upcoming.data ?? [])].slice(0, 6));
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    statusLabel(status: string): string {
        return this.catalogService.label('match_statuses', status);
    }

    severity(status: string) {
        return matchStatusSeverity(status);
    }
}
