import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { CatalogService } from '../../service/catalog.service';
import { GroupStandings } from '../../service/interfaces/match.interface';
import { TournamentResponse } from '../../service/interfaces/tournament.interface';
import { MatchService } from '../../service/match.service';
import { TournamentService } from '../../service/tournament.service';

/** A compact live table for whichever tournament is currently running. */
@Component({
    standalone: true,
    selector: 'app-standings-widget',
    imports: [CommonModule, FormsModule, RouterModule, SelectModule],
    template: `
        <div class="card">
            <div class="flex flex-wrap justify-between items-center gap-3 mb-5">
                <div class="font-semibold text-xl">Tabla de posiciones</div>
                @if (tournaments().length > 1) {
                    <p-select [options]="tournaments()" [(ngModel)]="selectedId" optionLabel="name" optionValue="id"
                              (onChange)="loadStandings()" styleClass="w-full sm:w-56" placeholder="Torneo" />
                }
            </div>

            @if (loading()) {
                <div class="text-center py-8 text-muted-color"><i class="pi pi-spin pi-spinner text-2xl"></i></div>
            } @else if (groups().length === 0) {
                <div class="text-center py-10">
                    <i class="pi pi-table text-4xl text-muted-color mb-3 block"></i>
                    <span class="text-muted-color">Todavía no hay resultados cargados.</span>
                </div>
            } @else {
                @for (group of groups(); track group.group_name) {
                    <div class="mb-5 last:mb-0">
                        @if (groups().length > 1) {
                            <div class="font-medium text-sm text-muted-color uppercase tracking-wide mb-2">{{ group.group_name }}</div>
                        }
                        <div class="overflow-x-auto">
                            <table class="w-full text-sm">
                                <thead>
                                    <tr class="text-muted-color text-xs uppercase">
                                        <th class="text-left font-medium py-2 pr-2">#</th>
                                        <th class="text-left font-medium py-2">Equipo</th>
                                        <th class="text-center font-medium py-2 px-2">PJ</th>
                                        <th class="text-center font-medium py-2 px-2">DG</th>
                                        <th class="text-center font-medium py-2 px-2">Pts</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @for (entry of group.entries.slice(0, 6); track entry.team_id) {
                                        <tr class="border-t border-surface">
                                            <td class="py-2 pr-2 tabular-nums"
                                                [class.text-primary]="entry.is_advancing"
                                                [class.font-bold]="entry.is_advancing">{{ entry.position }}</td>
                                            <td class="py-2 truncate max-w-[10rem]">{{ entry.team_name }}</td>
                                            <td class="py-2 px-2 text-center tabular-nums">{{ entry.matches_played }}</td>
                                            <td class="py-2 px-2 text-center tabular-nums">{{ entry.goal_difference > 0 ? '+' : '' }}{{ entry.goal_difference }}</td>
                                            <td class="py-2 px-2 text-center tabular-nums font-semibold">{{ entry.points }}</td>
                                        </tr>
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                }
                @if (selectedId) {
                    <a [routerLink]="['/pages/tournaments', selectedId, 'standings']" class="text-primary text-sm font-medium">Ver tabla completa</a>
                }
            }
        </div>
    `
})
export class StandingsWidget implements OnInit {
    private readonly tournamentService = inject(TournamentService);
    private readonly matchService = inject(MatchService);
    protected readonly catalogService = inject(CatalogService);

    readonly tournaments = signal<TournamentResponse[]>([]);
    readonly groups = signal<GroupStandings[]>([]);
    readonly loading = signal(true);
    selectedId?: number;

    ngOnInit() {
        this.tournamentService.getTournaments().subscribe({
            next: (res) => {
                const all = res.data ?? [];
                this.tournaments.set(all);
                // Prefer a tournament that is actually being played.
                this.selectedId = (all.find((t) => t.status === 'ongoing') ?? all[0])?.id;
                this.selectedId ? this.loadStandings() : this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    loadStandings() {
        if (!this.selectedId) return;
        this.loading.set(true);

        this.matchService.getStandings(this.selectedId).subscribe({
            next: (res) => {
                this.groups.set((res.data?.groups ?? []).filter((g) => g.entries?.length));
                this.loading.set(false);
            },
            error: () => {
                this.groups.set([]);
                this.loading.set(false);
            }
        });
    }
}
