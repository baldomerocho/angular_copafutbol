import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../service/auth.service';
import { CatalogService } from '../service/catalog.service';
import { TournamentResponse } from '../service/interfaces/tournament.interface';
import { TournamentService } from '../service/tournament.service';
import { RegistrationWaiverResponse, WaiverService } from '../service/waiver.service';
import { ServerTable } from '../shared/server-table';
import { Severity } from '../shared/status';

/**
 * Authorisation requests. Most squad rules are not prohibitions but decisions —
 * a player without papers yet, someone already turning out in the cup — so the
 * organizer answers them here rather than the system refusing on their behalf.
 */
@Component({
    selector: 'app-waivers',
    standalone: true,
    imports: [
        CommonModule, FormsModule, RouterModule, TableModule, ButtonModule, ToastModule,
        ToolbarModule, TagModule, DialogModule, SelectModule, TextareaModule, MessageModule, TooltipModule
    ],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="card">
            <p-toolbar styleClass="mb-4">
                <ng-template pTemplate="start">
                    <div>
                        <h1 class="text-xl font-semibold m-0">{{ isManager() ? 'Mis solicitudes' : 'Solicitudes de inscripción' }}</h1>
                        <p class="text-muted-color text-sm mt-1 mb-0">{{ subtitle() }}</p>
                    </div>
                </ng-template>
            </p-toolbar>

            <div class="flex flex-wrap gap-3 mb-4">
                <p-select [options]="tournaments()" [(ngModel)]="tournamentFilter" (onChange)="table.reload()"
                          optionLabel="name" optionValue="id" placeholder="Todos los torneos"
                          [showClear]="true" styleClass="w-full sm:w-64" />
                <p-select [options]="catalog('waiver_statuses')" [(ngModel)]="statusFilter" (onChange)="table.reload()"
                          optionLabel="name" optionValue="id" placeholder="Todos los estados"
                          [showClear]="true" styleClass="w-full sm:w-52" />
            </div>

            <p-table [value]="table.rows()" [lazy]="true" (onLazyLoad)="table.onLazyLoad($event)"
                     [paginator]="true" [rows]="table.perPage" [totalRecords]="table.total()" [first]="table.first"
                     [rowsPerPageOptions]="[15, 30, 60]" [loading]="table.loading()"
                     currentPageReportTemplate="{first} - {last} de {totalRecords}" [showCurrentPageReport]="true"
                     responsiveLayout="scroll" dataKey="id">
                <ng-template pTemplate="header">
                    <tr>
                        <th>Jugador</th>
                        <th>Motivo</th>
                        <th>Cargo</th>
                        <th>Estado</th>
                        <th style="width: 11rem">Acciones</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-waiver>
                    <tr>
                        <td>
                            <a [routerLink]="['/publico/jugadores', waiver.player_id]"
                               class="font-medium no-underline text-color hover:underline">{{ waiver.player_name }}</a>
                            <div class="text-muted-color text-xs">{{ waiver.team_name }} · {{ waiver.tournament_name }}</div>
                        </td>
                        <td>
                            <div class="text-sm">{{ ruleLabel(waiver.rule) }}</div>
                            <div class="text-muted-color text-xs">{{ waiver.detail }}</div>
                            @if (waiver.reason) {
                                <div class="text-xs italic mt-1">"{{ waiver.reason }}"</div>
                            }
                        </td>
                        <td class="tabular-nums text-sm">
                            @if (waiver.fee_amount) {
                                {{ waiver.fee_amount.toFixed(2) }} {{ waiver.currency }}
                                @if (waiver.payment_status) {
                                    <div class="text-xs" [class.text-green-600]="waiver.payment_status === 'approved'"
                                         [class.text-orange-500]="waiver.payment_status === 'pending'">
                                        Pago {{ paymentLabel(waiver.payment_status) }}
                                    </div>
                                }
                            } @else {
                                <span class="text-muted-color">Sin cargo</span>
                            }
                        </td>
                        <td>
                            <p-tag [value]="statusLabel(waiver.status)" [severity]="statusTone(waiver.status)" styleClass="text-xs" />
                            @if (waiver.notes) {
                                <div class="text-muted-color text-xs mt-1">{{ waiver.notes }}</div>
                            }
                        </td>
                        <td>
                            @if (waiver.status === 'pending' && !isManager()) {
                                <div class="flex gap-1">
                                    <p-button label="Autorizar" size="small" severity="success"
                                              (onClick)="open(waiver, 'approve')" />
                                    <p-button icon="pi pi-times" size="small" severity="danger" [text]="true"
                                              pTooltip="Rechazar" tooltipPosition="top"
                                              (onClick)="open(waiver, 'reject')" />
                                </div>
                            } @else if (waiver.status === 'pending') {
                                <span class="text-muted-color text-sm">Esperando al organizador</span>
                            } @else {
                                <span class="text-muted-color text-sm">{{ waiver.resolved_at | date: 'dd/MM/yyyy' }}</span>
                            }
                        </td>
                    </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="5">
                            <div class="text-center py-10">
                                <i class="pi pi-check-circle text-4xl text-muted-color mb-3 block"></i>
                                <div class="text-muted-color">No hay solicitudes.</div>
                            </div>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <p-dialog [(visible)]="dialog" [style]="{ width: '520px' }" [modal]="true"
                  [header]="action === 'approve' ? 'Autorizar inscripción' : 'Rechazar solicitud'">
            @if (selected) {
                <div class="flex flex-col gap-4">
                    <div class="border border-surface rounded-border p-3 text-sm">
                        <div class="font-medium">{{ selected.player_name }}</div>
                        <div class="text-muted-color">{{ selected.team_name }} · {{ selected.tournament_name }}</div>
                        <div class="mt-2">{{ selected.detail }}</div>
                    </div>

                    @if (action === 'approve') {
                        @if (selected.fee_amount) {
                            <p-message severity="warn" icon="pi pi-dollar" styleClass="w-full">
                                Se generará un cargo de {{ selected.fee_amount.toFixed(2) }} {{ selected.currency }}.
                                {{ paymentHint() }}
                            </p-message>
                        } @else {
                            <p-message severity="secondary" icon="pi pi-info-circle" styleClass="w-full">
                                Sin cargo: el jugador queda habilitado de inmediato.
                            </p-message>
                        }
                    } @else {
                        <p-message severity="secondary" icon="pi pi-info-circle" styleClass="w-full">
                            El jugador seguirá en la lista pero sin poder ser alineado. Darlo de baja es
                            decisión del delegado.
                        </p-message>
                    }

                    <div class="flex flex-col gap-2">
                        <label class="font-medium">Observaciones</label>
                        <textarea pTextarea rows="2" [(ngModel)]="notes"
                                  placeholder="Queda registrado junto a la resolución"></textarea>
                    </div>
                </div>
            }

            <ng-template pTemplate="footer">
                <p-button label="Cancelar" [text]="true" (onClick)="dialog = false" />
                <p-button [label]="action === 'approve' ? 'Autorizar' : 'Rechazar'"
                          [severity]="action === 'approve' ? 'success' : 'danger'"
                          [loading]="working()" (onClick)="resolve()" />
            </ng-template>
        </p-dialog>
    `
})
export class Waivers implements OnInit {
    private readonly waiverService = inject(WaiverService);
    private readonly tournamentService = inject(TournamentService);
    private readonly catalogService = inject(CatalogService);
    private readonly authService = inject(AuthService);
    private readonly messageService = inject(MessageService);

    readonly tournaments = signal<TournamentResponse[]>([]);
    readonly working = signal(false);

    readonly table: ServerTable<RegistrationWaiverResponse> = new ServerTable<RegistrationWaiverResponse>((paging) =>
        this.waiverService.getWaivers({
            ...paging,
            tournament_id: this.tournamentFilter,
            status: this.statusFilter
        })
    );

    tournamentFilter?: number;
    statusFilter?: 'pending' | 'approved' | 'rejected';

    dialog = false;
    action: 'approve' | 'reject' = 'approve';
    selected: RegistrationWaiverResponse | null = null;
    notes = '';

    ngOnInit() {
        this.tournamentService.getTournaments().subscribe({
            next: (res) => this.tournaments.set(res.data ?? [])
        });
        // The lazy table loads the first page itself.
    }

    isManager(): boolean {
        return this.authService.isManager();
    }

    subtitle(): string {
        return this.isManager()
            ? 'Jugadores que inscribiste y necesitan la autorización del organizador.'
            : 'Inscripciones que las reglas del torneo dejaron en tus manos.';
    }

    catalog(key: 'waiver_statuses') {
        return this.catalogService.get(key);
    }

    ruleLabel(rule: string): string {
        return this.catalogService.label('eligibility_rules', rule);
    }

    statusLabel(status: string): string {
        return this.catalogService.label('waiver_statuses', status);
    }

    statusTone(status: string): Severity {
        if (status === 'approved') return 'success';
        if (status === 'rejected') return 'danger';
        return 'warn';
    }

    paymentLabel(status: string): string {
        return this.catalogService.label('payment_statuses', status);
    }

    /** Whether the charge has to clear before the player can be fielded. */
    paymentHint(): string {
        const tournament = this.tournaments().find((t) => t.id === this.selected?.tournament_id);
        return tournament?.allow_late_payment
            ? 'El jugador queda habilitado ya; el pago queda pendiente.'
            : 'El jugador quedará habilitado cuando se apruebe ese pago.';
    }

    open(waiver: RegistrationWaiverResponse, action: 'approve' | 'reject') {
        this.selected = waiver;
        this.action = action;
        this.notes = '';
        this.dialog = true;
    }

    resolve() {
        if (!this.selected) return;

        this.working.set(true);
        const request =
            this.action === 'approve'
                ? this.waiverService.approve(this.selected.id, this.notes)
                : this.waiverService.reject(this.selected.id, this.notes);

        request.subscribe({
            next: () => {
                this.working.set(false);
                this.dialog = false;
                this.messageService.add({
                    severity: 'success',
                    summary: this.action === 'approve' ? 'Autorizada' : 'Rechazada',
                    detail: 'Se notificó al delegado.'
                });
                this.table.refresh();
            },
            error: (err) => {
                this.working.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'No se pudo resolver',
                    detail: err.error?.message ?? 'Inténtalo de nuevo.'
                });
            }
        });
    }
}
