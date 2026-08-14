import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { ConfigService } from '../../service/config.service';
import { MonitoringTeamStatus } from '../../service/interfaces/team.interface';
import { TournamentResponse } from '../../service/interfaces/tournament.interface';
import { TeamService } from '../../service/team.service';
import { TournamentService } from '../../service/tournament.service';

/** Who owes what: expected versus approved, per enrolled team. */
@Component({
    selector: 'app-payment-monitoring',
    standalone: true,
    imports: [
        CommonModule, FormsModule, RouterModule, TableModule, ButtonModule, ToastModule,
        ToolbarModule, TagModule, SelectModule, SelectButtonModule, ProgressBarModule
    ],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="card">
            <p-toolbar styleClass="mb-4">
                <ng-template pTemplate="start">
                    <div>
                        <h1 class="text-xl font-semibold m-0">Morosidad</h1>
                        <p class="text-muted-color text-sm mt-1 mb-0">Estado de cobro de cada equipo inscrito.</p>
                    </div>
                </ng-template>
                <ng-template pTemplate="end">
                    <p-button label="Ver pagos" icon="pi pi-wallet" severity="secondary" [outlined]="true"
                              routerLink="/pages/payments" />
                </ng-template>
            </p-toolbar>

            <div class="grid grid-cols-12 gap-4 mb-5">
                <div class="col-span-6 md:col-span-3">
                    <div class="border border-surface rounded-border p-3">
                        <div class="text-muted-color text-xs uppercase tracking-wide mb-1">Esperado</div>
                        <div class="text-lg font-semibold tabular-nums">{{ money(totalExpected()) }}</div>
                    </div>
                </div>
                <div class="col-span-6 md:col-span-3">
                    <div class="border border-surface rounded-border p-3">
                        <div class="text-muted-color text-xs uppercase tracking-wide mb-1">Cobrado</div>
                        <div class="text-lg font-semibold tabular-nums text-green-600">{{ money(totalPaid()) }}</div>
                    </div>
                </div>
                <div class="col-span-6 md:col-span-3">
                    <div class="border border-surface rounded-border p-3">
                        <div class="text-muted-color text-xs uppercase tracking-wide mb-1">Por cobrar</div>
                        <div class="text-lg font-semibold tabular-nums text-orange-600">{{ money(totalExpected() - totalPaid()) }}</div>
                    </div>
                </div>
                <div class="col-span-6 md:col-span-3">
                    <div class="border border-surface rounded-border p-3">
                        <div class="text-muted-color text-xs uppercase tracking-wide mb-1">Equipos al día</div>
                        <div class="text-lg font-semibold tabular-nums">{{ fullyPaidCount() }} / {{ rows().length }}</div>
                    </div>
                </div>
            </div>

            <div class="flex flex-wrap gap-3 mb-4">
                <p-select [options]="tournaments()" [(ngModel)]="tournamentFilter" (onChange)="load()"
                          optionLabel="name" optionValue="id" placeholder="Todos los torneos"
                          [showClear]="true" styleClass="w-full sm:w-64" />
                <p-selectbutton [options]="filterOptions" [(ngModel)]="stateFilter" (onChange)="load()"
                                optionLabel="label" optionValue="value" [allowEmpty]="false" />
            </div>

            <p-table [value]="rows()" [rows]="15" [paginator]="rows().length > 15" [loading]="loading()"
                     responsiveLayout="scroll" dataKey="team_id">
                <ng-template pTemplate="header">
                    <tr>
                        <th>Equipo</th>
                        <th>Delegado</th>
                        <th>Torneo</th>
                        <th class="text-right">Esperado</th>
                        <th class="text-right">Pagado</th>
                        <th style="width: 12rem">Avance</th>
                        <th>Pendiente</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-row>
                    <tr>
                        <td class="font-medium">{{ row.team_name }}</td>
                        <td class="text-sm text-muted-color">{{ row.manager_name || '—' }}</td>
                        <td class="text-sm text-muted-color">{{ row.tournament_name }}</td>
                        <td class="text-right tabular-nums">{{ money(row.total_expected) }}</td>
                        <td class="text-right tabular-nums font-medium">{{ money(row.total_paid) }}</td>
                        <td>
                            <p-progressbar [value]="round(row.status_percentage)" [showValue]="true"
                                           [style]="{ height: '1.25rem' }" />
                        </td>
                        <td>
                            @if (row.is_fully_paid) {
                                <p-tag value="Al día" severity="success" />
                            } @else {
                                <div class="flex flex-wrap gap-1">
                                    @for (missing of row.missing_payments; track missing.name) {
                                        <p-tag [value]="missing.name + ' · ' + money(missing.amount)"
                                               severity="warn" styleClass="text-xs" />
                                    }
                                </div>
                            }
                        </td>
                    </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="7">
                            <div class="text-center py-10">
                                <i class="pi pi-check-circle text-4xl text-green-500 mb-3 block"></i>
                                <div class="text-muted-color">No hay equipos con estos filtros.</div>
                            </div>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>
    `
})
export class PaymentMonitoring implements OnInit {
    private readonly teamService = inject(TeamService);
    private readonly tournamentService = inject(TournamentService);
    private readonly configService = inject(ConfigService);
    private readonly messageService = inject(MessageService);

    readonly rows = signal<MonitoringTeamStatus[]>([]);
    readonly tournaments = signal<TournamentResponse[]>([]);
    readonly loading = signal(true);

    tournamentFilter?: number;
    stateFilter: 'all' | 'missing' | 'paid' = 'all';

    readonly filterOptions = [
        { label: 'Todos', value: 'all' },
        { label: 'Con deuda', value: 'missing' },
        { label: 'Al día', value: 'paid' }
    ];

    ngOnInit() {
        this.tournamentService.getTournaments().subscribe({
            next: (res) => this.tournaments.set(res.data ?? [])
        });
        this.load();
    }

    load() {
        this.loading.set(true);
        this.teamService
            .getMonitoring({
                tournament_id: this.tournamentFilter,
                missing_only: this.stateFilter === 'missing' ? true : undefined,
                fully_paid: this.stateFilter === 'paid' ? true : undefined
            })
            .subscribe({
                next: (res) => {
                    this.rows.set(res.data ?? []);
                    this.loading.set(false);
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la morosidad.' });
                    this.loading.set(false);
                }
            });
    }

    money(amount: number): string {
        return this.configService.currencySymbol() + (amount ?? 0).toFixed(2);
    }

    round(value: number): number {
        return Math.round(value ?? 0);
    }

    totalExpected(): number {
        return this.rows().reduce((total, row) => total + (row.total_expected ?? 0), 0);
    }

    totalPaid(): number {
        return this.rows().reduce((total, row) => total + (row.total_paid ?? 0), 0);
    }

    fullyPaidCount(): number {
        return this.rows().filter((row) => row.is_fully_paid).length;
    }
}
