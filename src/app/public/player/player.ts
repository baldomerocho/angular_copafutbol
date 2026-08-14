import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { CatalogService } from '../../pages/service/catalog.service';
import { PlayerProfileResponse, PlayerStatsResponse } from '../../pages/service/interfaces/match.interface';
import { PlayerService } from '../../pages/service/player.service';

/**
 * A player's card. The same person can be on several squads — first division and
 * reserves, or two tournaments at once — so the record is broken down per tournament
 * and only then totalled.
 */
@Component({
    selector: 'app-public-player',
    standalone: true,
    imports: [CommonModule, RouterModule, TagModule, ButtonModule, TableModule],
    template: `
        @if (loading()) {
            <div class="text-center py-20 text-muted-color"><i class="pi pi-spin pi-spinner text-3xl"></i></div>
        } @else if (!profile()) {
            <div class="text-center py-20">
                <i class="pi pi-exclamation-circle text-4xl text-muted-color mb-3 block"></i>
                <div class="text-muted-color mb-4">No encontramos a ese jugador.</div>
                <p-button label="Volver al inicio" routerLink="/publico" />
            </div>
        } @else {
            <a routerLink="/publico" class="text-muted-color text-sm no-underline">
                <i class="pi pi-arrow-left mr-1"></i>Volver al inicio
            </a>

            <!-- Cabecera -->
            <div class="bg-surface-0 dark:bg-surface-900 border border-surface rounded-border p-6 md:p-8 mt-4 mb-6">
                <div class="flex flex-wrap items-center gap-6">
                    @if (player().photo_url) {
                        <img [src]="player().photo_url" [alt]="player().name"
                             class="w-24 h-24 rounded-full object-cover border border-surface" />
                    } @else {
                        <div class="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold">
                            {{ initials() }}
                        </div>
                    }

                    <div class="flex-1 min-w-0">
                        <h1 class="text-2xl md:text-3xl font-bold m-0">{{ player().name }}</h1>
                        <div class="flex flex-wrap items-center gap-2 mt-2">
                            @if (player().position) {
                                <p-tag [value]="positionLabel()" severity="info" />
                            }
                            @if (player().age) {
                                <span class="text-muted-color text-sm">{{ player().age }} años</span>
                            }
                            @if (activeSuspension()) {
                                <p-tag value="Suspendido" severity="danger" icon="pi pi-ban" />
                            }
                        </div>
                        @if (currentSquads().length) {
                            <div class="text-muted-color text-sm mt-2">
                                {{ currentSquads().join(' · ') }}
                            </div>
                        }
                    </div>

                    <!-- Totales de carrera -->
                    <div class="flex gap-6 md:gap-8">
                        @for (stat of headline(); track stat.label) {
                            <div class="text-center">
                                <div class="text-3xl font-bold tabular-nums">{{ stat.value }}</div>
                                <div class="text-muted-color text-xs uppercase tracking-wide mt-1">{{ stat.label }}</div>
                            </div>
                        }
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-12 gap-6">
                <!-- Rendimiento por torneo -->
                <div class="col-span-12 lg:col-span-8">
                    <div class="bg-surface-0 dark:bg-surface-900 border border-surface rounded-border p-5">
                        <div class="font-semibold mb-4">Rendimiento por torneo</div>

                        @if (profile()!.records.length) {
                            <p-table [value]="profile()!.records" responsiveLayout="scroll" styleClass="p-datatable-sm">
                                <ng-template pTemplate="header">
                                    <tr>
                                        <th>Equipo</th>
                                        <th class="text-center">PJ</th>
                                        <th class="text-center">G</th>
                                        <th class="text-center">A</th>
                                        <th class="text-center">G/PJ</th>
                                        <th class="text-center">TA</th>
                                        <th class="text-center">TR</th>
                                    </tr>
                                </ng-template>
                                <ng-template pTemplate="body" let-record>
                                    <tr>
                                        <td>
                                            <div class="font-medium">{{ record.team_name }}</div>
                                            @if (record.player_number) {
                                                <div class="text-muted-color text-xs">Dorsal {{ record.player_number }}</div>
                                            }
                                        </td>
                                        <td class="text-center tabular-nums">{{ record.matches_played }}</td>
                                        <td class="text-center tabular-nums font-semibold">{{ record.goals }}</td>
                                        <td class="text-center tabular-nums">{{ record.assists }}</td>
                                        <td class="text-center tabular-nums text-muted-color">{{ record.goals_per_match }}</td>
                                        <td class="text-center tabular-nums">
                                            @if (record.yellows) {
                                                <span class="inline-block w-3 h-4 rounded-sm bg-yellow-400 mr-1 align-middle"></span>{{ record.yellows }}
                                            } @else { — }
                                        </td>
                                        <td class="text-center tabular-nums">
                                            @if (record.reds) {
                                                <span class="inline-block w-3 h-4 rounded-sm bg-red-500 mr-1 align-middle"></span>{{ record.reds }}
                                            } @else { — }
                                        </td>
                                    </tr>
                                </ng-template>
                            </p-table>
                        } @else {
                            <div class="text-muted-color text-sm py-8 text-center">
                                Todavía no ha disputado partidos.
                            </div>
                        }
                    </div>
                </div>

                <!-- Plantillas -->
                <div class="col-span-12 lg:col-span-4">
                    <div class="bg-surface-0 dark:bg-surface-900 border border-surface rounded-border p-5 h-full">
                        <div class="font-semibold mb-4">Plantillas</div>

                        @for (squad of profile()!.squads; track squad.id) {
                            <div class="flex items-center gap-3 py-3 border-b border-surface last:border-0">
                                <div class="w-9 h-9 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center font-bold tabular-nums text-sm">
                                    {{ squad.number }}
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="font-medium truncate">{{ squad.team_name }}</div>
                                    <div class="text-muted-color text-xs">
                                        {{ squad.position ? label(squad.position) : 'Sin posición' }}
                                        @if (squad.is_captain) { · Capitán }
                                    </div>
                                </div>
                                @if (!squad.active) {
                                    <p-tag value="Baja" severity="secondary" styleClass="text-xs" />
                                }
                            </div>
                        } @empty {
                            <div class="text-muted-color text-sm py-6 text-center">
                                No está inscrito en ninguna plantilla.
                            </div>
                        }
                    </div>
                </div>
            </div>
        }
    `
})
export class PublicPlayer implements OnInit {
    private readonly playerService = inject(PlayerService);
    private readonly catalogService = inject(CatalogService);
    private readonly route = inject(ActivatedRoute);

    readonly profile = signal<PlayerProfileResponse | null>(null);
    readonly loading = signal(true);

    ngOnInit() {
        const id = Number(this.route.snapshot.params['id']);
        this.playerService.getProfile(id).subscribe({
            next: (res) => {
                this.profile.set(res.data ?? null);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    player() {
        return this.profile()!.player;
    }

    initials(): string {
        return this.player()
            .name.split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((word) => word[0].toUpperCase())
            .join('');
    }

    positionLabel(): string {
        return this.label(this.player().position ?? '');
    }

    /** Roster entries store the raw enum; the catalog holds the Spanish label. */
    label(position: string): string {
        return this.catalogService.label('player_positions', position);
    }

    /** The squads they are currently active in, as "Equipo (dorsal)". */
    currentSquads(): string[] {
        return this.profile()!
            .squads.filter((squad) => squad.active)
            .map((squad) => `${squad.team_name} (${squad.number})`);
    }

    /** Suspended anywhere means suspended — the badge is a warning, not a per-tournament fact. */
    activeSuspension(): boolean {
        return this.profile()!.records.some((record) => record.suspended);
    }

    /** The four numbers worth reading at a glance. */
    headline(): { label: string; value: number | string }[] {
        const totals: PlayerStatsResponse = this.profile()!.totals;
        return [
            { label: 'Partidos', value: totals.matches_played },
            { label: 'Goles', value: totals.goals },
            { label: 'Asist.', value: totals.assists },
            { label: 'G/PJ', value: totals.goals_per_match }
        ];
    }
}
