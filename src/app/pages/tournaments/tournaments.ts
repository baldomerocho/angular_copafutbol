import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { CatalogService } from '../service/catalog.service';
import { ConfigService } from '../service/config.service';
import { TournamentResponse } from '../service/interfaces/tournament.interface';
import { TournamentService } from '../service/tournament.service';
import { tournamentStatusSeverity } from '../shared/status';

@Component({
    selector: 'app-tournaments',
    standalone: true,
    imports: [
        CommonModule, FormsModule, RouterModule, TableModule, ButtonModule, InputTextModule,
        ToastModule, ToolbarModule, ConfirmDialogModule, SelectModule, TagModule,
        IconFieldModule, InputIconModule, TooltipModule, MenuModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-confirmdialog [style]="{ width: '440px' }" />

        <div class="card">
            <p-toolbar styleClass="mb-4">
                <ng-template pTemplate="start">
                    <div>
                        <h1 class="text-xl font-semibold m-0">Torneos</h1>
                        <p class="text-muted-color text-sm mt-1 mb-0">Cada torneo define sus propias reglas de puntuación, desempate y sanciones.</p>
                    </div>
                </ng-template>
                <ng-template pTemplate="end">
                    <p-button label="Nuevo torneo" icon="pi pi-plus" (onClick)="openNew()" />
                </ng-template>
            </p-toolbar>

            <div class="flex flex-wrap gap-3 mb-4">
                <p-iconfield class="flex-1 min-w-[14rem]">
                    <p-inputicon class="pi pi-search" />
                    <input pInputText type="text" placeholder="Buscar torneo" class="w-full"
                           (input)="applySearch($any($event.target).value)" />
                </p-iconfield>
                <p-select [options]="statusOptions()" [(ngModel)]="statusFilter" (onChange)="load()"
                          optionLabel="name" optionValue="id" placeholder="Todos los estados"
                          [showClear]="true" styleClass="w-full sm:w-52" />
                <p-select [options]="typeOptions()" [(ngModel)]="typeFilter" (onChange)="load()"
                          optionLabel="name" optionValue="id" placeholder="Todos los formatos"
                          [showClear]="true" styleClass="w-full sm:w-56" />
            </div>

            <p-table [value]="filtered()" [rows]="10" [paginator]="filtered().length > 10"
                     [loading]="loading()" responsiveLayout="scroll" dataKey="id">
                <ng-template pTemplate="header">
                    <tr>
                        <th>Torneo</th>
                        <th>Formato</th>
                        <th class="text-center">Equipos</th>
                        <th>Inicio</th>
                        <th>Inscripción</th>
                        <th>Estado</th>
                        <th style="width: 13rem">Acciones</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-tournament>
                    <tr>
                        <td>
                            <div class="font-medium">{{ tournament.name }}</div>
                            <div class="text-muted-color text-sm">
                                {{ tournament.season ? tournament.season + ' · ' : '' }}{{ tournament.location || 'Sin sede definida' }}
                            </div>
                        </td>
                        <td>
                            <div>{{ typeLabel(tournament.type) }}</div>
                            <div class="text-muted-color text-xs">
                                {{ tournament.points_win }}-{{ tournament.points_draw }}-{{ tournament.points_loss }} pts
                                @if (tournament.double_round) { · ida y vuelta }
                            </div>
                        </td>
                        <td class="text-center tabular-nums">
                            {{ tournament.team_count || 0 }}<span class="text-muted-color">{{ tournament.max_teams ? '/' + tournament.max_teams : '' }}</span>
                        </td>
                        <td class="whitespace-nowrap">{{ tournament.start_date | date: 'dd/MM/yyyy' }}</td>
                        <td>
                            @if (tournament.registration_open) {
                                <span class="text-green-600 text-sm"><i class="pi pi-check-circle mr-1"></i>Abierta</span>
                            } @else {
                                <span class="text-muted-color text-sm"><i class="pi pi-lock mr-1"></i>Cerrada</span>
                            }
                            <div class="text-muted-color text-xs">{{ money(tournament.enrollment_price) }}</div>
                        </td>
                        <td><p-tag [value]="statusLabel(tournament.status)" [severity]="statusTone(tournament.status)" /></td>
                        <td>
                            <div class="flex gap-1">
                                <p-button icon="pi pi-sitemap" [rounded]="true" [text]="true" severity="secondary"
                                          pTooltip="Grupos" tooltipPosition="top"
                                          [routerLink]="['/pages/tournaments', tournament.id, 'groups']" />
                                <p-button icon="pi pi-calendar" [rounded]="true" [text]="true" severity="secondary"
                                          pTooltip="Calendario" tooltipPosition="top"
                                          [routerLink]="['/pages/tournaments', tournament.id, 'schedule']" />
                                <p-button icon="pi pi-list" [rounded]="true" [text]="true" severity="secondary"
                                          pTooltip="Tabla" tooltipPosition="top"
                                          [routerLink]="['/pages/tournaments', tournament.id, 'standings']" />
                                <p-button icon="pi pi-pencil" [rounded]="true" [text]="true"
                                          pTooltip="Editar" tooltipPosition="top"
                                          (onClick)="edit(tournament)" />
                                <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger"
                                          pTooltip="Eliminar" tooltipPosition="top"
                                          (onClick)="remove(tournament)" />
                            </div>
                        </td>
                    </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="7">
                            <div class="text-center py-10">
                                <i class="pi pi-trophy text-4xl text-muted-color mb-3 block"></i>
                                <div class="text-muted-color mb-4">Todavía no hay torneos.</div>
                                <p-button label="Crear el primero" icon="pi pi-plus" (onClick)="openNew()" />
                            </div>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>
    `
})
export class Tournaments implements OnInit {
    private readonly tournamentService = inject(TournamentService);
    private readonly catalogService = inject(CatalogService);
    private readonly configService = inject(ConfigService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly router = inject(Router);

    readonly tournaments = signal<TournamentResponse[]>([]);
    readonly filtered = signal<TournamentResponse[]>([]);
    readonly loading = signal(true);

    statusFilter?: string;
    typeFilter?: string;
    private search = '';

    ngOnInit() {
        this.load();
    }

    statusOptions() {
        return this.catalogService.get('tournament_statuses');
    }

    typeOptions() {
        return this.catalogService.get('tournament_types');
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

    money(amount?: number): string {
        return this.configService.currencySymbol() + (amount ?? 0).toFixed(2);
    }

    load() {
        this.loading.set(true);
        this.tournamentService.getTournaments({ status: this.statusFilter, type: this.typeFilter }).subscribe({
            next: (res) => {
                this.tournaments.set(res.data ?? []);
                this.applySearch(this.search);
                this.loading.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los torneos.' });
                this.loading.set(false);
            }
        });
    }

    applySearch(term: string) {
        this.search = term ?? '';
        const needle = this.search.trim().toLowerCase();
        this.filtered.set(
            needle
                ? this.tournaments().filter((t) =>
                      [t.name, t.season, t.location].some((field) => field?.toLowerCase().includes(needle))
                  )
                : this.tournaments()
        );
    }

    openNew() {
        this.router.navigate(['/pages/tournaments/new']);
    }

    edit(tournament: TournamentResponse) {
        this.router.navigate(['/pages/tournaments/edit', tournament.id]);
    }

    remove(tournament: TournamentResponse) {
        this.confirmationService.confirm({
            header: 'Eliminar torneo',
            message: `Se eliminarán también sus grupos, partidos y resultados. Los equipos quedarán libres. ¿Eliminar "${tournament.name}"?`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.tournamentService.deleteTournament(tournament.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: `"${tournament.name}" fue eliminado.` });
                        this.load();
                    },
                    error: (err) =>
                        this.messageService.add({
                            severity: 'error',
                            summary: 'No se pudo eliminar',
                            detail: err.error?.message ?? 'Inténtalo de nuevo.'
                        })
                });
            }
        });
    }
}
