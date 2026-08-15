import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { SuspensionResponse } from '../service/interfaces/match.interface';
import { TournamentResponse } from '../service/interfaces/tournament.interface';
import { MatchService } from '../service/match.service';
import { TournamentService } from '../service/tournament.service';
import { ServerTable } from '../shared/server-table';

/**
 * Sanctions board. Suspensions are created automatically when a card is recorded
 * and served automatically when the team plays; this screen is for reviewing them
 * and for lifting one by hand.
 */
@Component({
    selector: 'app-suspensions',
    standalone: true,
    imports: [
        CommonModule, FormsModule, RouterModule, TableModule, ButtonModule, ToastModule,
        ToolbarModule, ConfirmDialogModule, TagModule, SelectModule, SelectButtonModule, TooltipModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-confirmdialog [style]="{ width: '440px' }" />

        <div class="card">
            <p-toolbar styleClass="mb-4">
                <ng-template pTemplate="start">
                    <div>
                        <h1 class="text-xl font-semibold m-0">Sanciones</h1>
                        <p class="text-muted-color text-sm mt-1 mb-0">
                            Se aplican solas al registrar la tarjeta y se cumplen cuando el equipo juega.
                        </p>
                    </div>
                </ng-template>
            </p-toolbar>

            <div class="flex flex-wrap gap-3 mb-4">
                <p-select [options]="tournaments()" [(ngModel)]="tournamentFilter" (onChange)="table.reload()"
                          optionLabel="name" optionValue="id" placeholder="Todos los torneos"
                          [showClear]="true" styleClass="w-full sm:w-64" />
                <p-selectbutton [options]="activeOptions" [(ngModel)]="activeFilter" (onChange)="table.reload()"
                                optionLabel="label" optionValue="value" [allowEmpty]="false" />
            </div>

            <p-table [value]="table.rows()" [lazy]="true" (onLazyLoad)="table.onLazyLoad($event)"
                     [paginator]="true" [rows]="table.perPage" [totalRecords]="table.total()" [first]="table.first"
                     [rowsPerPageOptions]="[15, 30, 60]" [loading]="table.loading()"
                     currentPageReportTemplate="{first} - {last} de {totalRecords}" [showCurrentPageReport]="true"
                     responsiveLayout="scroll" dataKey="id">
                <ng-template pTemplate="header">
                    <tr>
                        <th>Jugador</th>
                        <th>Equipo</th>
                        <th>Motivo</th>
                        <th class="text-center">Cumplidos</th>
                        <th>Estado</th>
                        <th>Desde</th>
                        <th style="width: 11rem">Acciones</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-suspension>
                    <tr>
                        <td class="font-medium">{{ suspension.player_name }}</td>
                        <td>{{ suspension.team_name || '—' }}</td>
                        <td class="text-sm">{{ suspension.reason }}</td>
                        <td class="text-center tabular-nums">
                            {{ suspension.matches_served }} / {{ suspension.matches_count }}
                        </td>
                        <td>
                            <p-tag [value]="suspension.is_active ? 'Vigente' : 'Cumplida'"
                                   [severity]="suspension.is_active ? 'danger' : 'success'" />
                        </td>
                        <td class="text-sm text-muted-color whitespace-nowrap">{{ suspension.created_at | date: 'dd/MM/yyyy' }}</td>
                        <td>
                            @if (suspension.is_active) {
                                <div class="flex gap-1">
                                    <p-button icon="pi pi-check" [rounded]="true" [text]="true" severity="secondary"
                                              pTooltip="Marcar un partido cumplido" tooltipPosition="top"
                                              (onClick)="serveOne(suspension)" />
                                    <p-button icon="pi pi-plus" [rounded]="true" [text]="true" severity="secondary"
                                              pTooltip="Extender un partido" tooltipPosition="top"
                                              (onClick)="extend(suspension)" />
                                    <p-button icon="pi pi-unlock" [rounded]="true" [text]="true" severity="danger"
                                              pTooltip="Levantar sanción" tooltipPosition="top"
                                              (onClick)="lift(suspension)" />
                                </div>
                            } @else {
                                <span class="text-muted-color text-sm">—</span>
                            }
                        </td>
                    </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="7">
                            <div class="text-center py-10">
                                <i class="pi pi-check-circle text-4xl text-green-500 mb-3 block"></i>
                                <div class="text-muted-color">No hay sanciones con estos filtros.</div>
                            </div>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>
    `
})
export class Suspensions implements OnInit {
    private readonly matchService = inject(MatchService);
    private readonly tournamentService = inject(TournamentService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    readonly tournaments = signal<TournamentResponse[]>([]);

    readonly table: ServerTable<SuspensionResponse> = new ServerTable<SuspensionResponse>((paging) =>
        this.matchService.getSuspensions({
            ...paging,
            tournament_id: this.tournamentFilter,
            active: this.activeFilter === '' ? undefined : this.activeFilter === 'true'
        })
    );

    tournamentFilter?: number;
    activeFilter: 'true' | 'false' | '' = 'true';

    readonly activeOptions = [
        { label: 'Vigentes', value: 'true' },
        { label: 'Cumplidas', value: 'false' },
        { label: 'Todas', value: '' }
    ];

    ngOnInit() {
        this.tournamentService.getTournaments().subscribe({
            next: (res) => this.tournaments.set(res.data ?? [])
        });
        // The lazy table loads the first page itself.
    }

    serveOne(suspension: SuspensionResponse) {
        this.update(suspension, { matches_served: suspension.matches_served + 1 }, 'Partido marcado como cumplido.');
    }

    extend(suspension: SuspensionResponse) {
        this.update(suspension, { matches_count: suspension.matches_count + 1 }, 'Sanción extendida un partido.');
    }

    lift(suspension: SuspensionResponse) {
        this.confirmationService.confirm({
            header: 'Levantar sanción',
            message: `${suspension.player_name} volverá a poder ser alineado. ¿Continuar?`,
            icon: 'pi pi-unlock',
            acceptLabel: 'Levantar',
            rejectLabel: 'Cancelar',
            accept: () => this.update(suspension, { is_active: false }, 'Sanción levantada.')
        });
    }

    private update(suspension: SuspensionResponse, patch: Record<string, unknown>, successMessage: string) {
        this.matchService.updateSuspension(suspension.id, patch).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Listo', detail: successMessage });
                this.table.refreshAfterDelete();
            },
            error: (err) =>
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? 'No se pudo actualizar.' })
        });
    }
}
