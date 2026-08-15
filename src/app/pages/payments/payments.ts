import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { FluidModule } from 'primeng/fluid';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin } from 'rxjs';
import { AuthService } from '../service/auth.service';
import { CatalogService } from '../service/catalog.service';
import { ConfigService } from '../service/config.service';
import { PaymentRequest, PaymentResponse } from '../service/interfaces/payment.interface';
import { TeamResponse } from '../service/interfaces/team.interface';
import { TournamentResponse } from '../service/interfaces/tournament.interface';
import { PaymentFilters, PaymentService, PaymentSummaryResponse } from '../service/payment.service';
import { ServerTable } from '../shared/server-table';
import { TeamService } from '../service/team.service';
import { TournamentService } from '../service/tournament.service';
import { paymentStatusSeverity } from '../shared/status';

@Component({
    selector: 'app-payments',
    standalone: true,
    imports: [
        CommonModule, FormsModule, RouterModule, TableModule, ButtonModule, InputTextModule, InputNumberModule,
        DialogModule, ToastModule, ToolbarModule, ConfirmDialogModule, SelectModule, TagModule, FluidModule,
        IconFieldModule, InputIconModule, TooltipModule, MessageModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-confirmdialog [style]="{ width: '440px' }" />

        <div class="card">
            <p-toolbar styleClass="mb-4">
                <ng-template pTemplate="start">
                    <div>
                        <h1 class="text-xl font-semibold m-0">Pagos</h1>
                        <p class="text-muted-color text-sm mt-1 mb-0">{{ subtitle() }}</p>
                    </div>
                </ng-template>
                <ng-template pTemplate="end">
                    <div class="flex gap-2">
                        @if (isStaff()) {
                            <p-button label="Morosidad" icon="pi pi-chart-bar" severity="secondary" [outlined]="true"
                                      routerLink="/pages/payments/monitoring" />
                        }
                        <p-button label="Registrar pago" icon="pi pi-plus" (onClick)="openNew()" />
                    </div>
                </ng-template>
            </p-toolbar>

            <div class="grid grid-cols-12 gap-4 mb-5">
                @for (tile of totals(); track tile.label) {
                    <div class="col-span-6 md:col-span-3">
                        <div class="border border-surface rounded-border p-3">
                            <div class="text-muted-color text-xs uppercase tracking-wide mb-1">{{ tile.label }}</div>
                            <div class="text-lg font-semibold tabular-nums">{{ tile.value }}</div>
                        </div>
                    </div>
                }
            </div>

            <div class="flex flex-wrap gap-3 mb-4">
                <p-iconfield class="flex-1 min-w-[14rem]">
                    <p-inputicon class="pi pi-search" />
                    <input pInputText type="text" placeholder="Buscar por equipo o referencia" class="w-full"
                           (input)="table.setSearch($any($event.target).value)" />
                </p-iconfield>
                <p-select [options]="statusOptions()" [(ngModel)]="statusFilter" (onChange)="table.reload()"
                          optionLabel="name" optionValue="id" placeholder="Todos los estados"
                          [showClear]="true" styleClass="w-full sm:w-52" />
                <p-select [options]="typeOptions()" [(ngModel)]="typeFilter" (onChange)="table.reload()"
                          optionLabel="name" optionValue="id" placeholder="Todos los conceptos"
                          [showClear]="true" styleClass="w-full sm:w-52" />
            </div>

            <p-table [value]="table.rows()" [lazy]="true" (onLazyLoad)="table.onLazyLoad($event)"
                     [paginator]="true" [rows]="table.perPage" [totalRecords]="table.total()" [first]="table.first"
                     [rowsPerPageOptions]="[15, 30, 60]" [loading]="table.loading()"
                     currentPageReportTemplate="{first} - {last} de {totalRecords}" [showCurrentPageReport]="true"
                     responsiveLayout="scroll" dataKey="id">
                <ng-template pTemplate="header">
                    <tr>
                        <th>Fecha</th>
                        <th>Equipo</th>
                        <th>Torneo</th>
                        <th>Concepto</th>
                        <th class="text-right">Monto</th>
                        <th>Referencia</th>
                        <th>Estado</th>
                        @if (isStaff()) { <th style="width: 9rem">Acciones</th> }
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-payment>
                    <tr>
                        <td class="whitespace-nowrap text-sm">{{ payment.created_at | date: 'dd/MM/yyyy' }}</td>
                        <td class="font-medium">{{ payment.team?.name || '—' }}</td>
                        <td class="text-sm text-muted-color">{{ payment.tournament?.name || '—' }}</td>
                        <td>{{ typeLabel(payment.type) }}</td>
                        <td class="text-right tabular-nums font-medium">{{ money(payment.amount) }}</td>
                        <td class="text-sm text-muted-color">{{ payment.external_id || '—' }}</td>
                        <td><p-tag [value]="statusLabel(payment.status)" [severity]="tone(payment.status)" /></td>
                        @if (isStaff()) {
                            <td>
                                <div class="flex gap-1">
                                    @if (payment.status !== 'approved') {
                                        <p-button icon="pi pi-check" [rounded]="true" [text]="true" severity="success"
                                                  pTooltip="Aprobar" tooltipPosition="top" (onClick)="setStatus(payment, 'approved')" />
                                    }
                                    @if (payment.status !== 'rejected') {
                                        <p-button icon="pi pi-times" [rounded]="true" [text]="true" severity="danger"
                                                  pTooltip="Rechazar" tooltipPosition="top" (onClick)="setStatus(payment, 'rejected')" />
                                    }
                                    <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="secondary"
                                              pTooltip="Eliminar" tooltipPosition="top" (onClick)="remove(payment)" />
                                </div>
                            </td>
                        }
                    </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td [attr.colspan]="isStaff() ? 8 : 7">
                            <div class="text-center py-10">
                                <i class="pi pi-wallet text-4xl text-muted-color mb-3 block"></i>
                                <div class="text-muted-color">No hay pagos con estos filtros.</div>
                            </div>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <p-dialog [(visible)]="paymentDialog" [style]="{ width: '520px' }" [modal]="true" header="Registrar pago">
            <p-fluid>
                <div class="flex flex-col gap-4">
                    <div class="flex flex-col gap-2">
                        <label class="font-medium">Torneo</label>
                        <p-select [options]="tournaments()" [(ngModel)]="form.tournament_id" optionLabel="name"
                                  optionValue="id" placeholder="Selecciona un torneo" appendTo="body"
                                  (onChange)="onTournamentChange()" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label class="font-medium">Equipo</label>
                        <p-select [options]="teams()" [(ngModel)]="form.team_id" optionLabel="name" optionValue="id"
                                  placeholder="Selecciona un equipo" appendTo="body" [filter]="true" filterBy="name" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label class="font-medium">Concepto</label>
                        <p-select [options]="typeOptions()" [(ngModel)]="form.type" optionLabel="name" optionValue="id"
                                  appendTo="body" (onChange)="suggestAmount()" />
                    </div>

                    <div class="grid grid-cols-12 gap-3">
                        <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                            <label class="font-medium">Monto</label>
                            <p-inputnumber [(ngModel)]="form.amount" mode="currency" currency="USD" locale="es" [min]="0" />
                        </div>
                        <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                            <label class="font-medium">Referencia</label>
                            <input pInputText [(ngModel)]="form.external_id" placeholder="Nº de comprobante" />
                        </div>
                    </div>

                    <p-message severity="secondary" icon="pi pi-info-circle" styleClass="w-full">
                        El pago queda pendiente hasta que el staff lo apruebe.
                    </p-message>
                </div>
            </p-fluid>

            <ng-template pTemplate="footer">
                <p-button label="Cancelar" [text]="true" (onClick)="paymentDialog = false" />
                <p-button label="Registrar" icon="pi pi-check" [loading]="working()" (onClick)="save()" />
            </ng-template>
        </p-dialog>
    `
})
export class Payments implements OnInit {
    private readonly paymentService = inject(PaymentService);
    private readonly tournamentService = inject(TournamentService);
    private readonly teamService = inject(TeamService);
    private readonly catalogService = inject(CatalogService);
    private readonly configService = inject(ConfigService);
    private readonly authService = inject(AuthService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    readonly tournaments = signal<TournamentResponse[]>([]);
    readonly teams = signal<TeamResponse[]>([]);
    readonly summary = signal<PaymentSummaryResponse | null>(null);
    readonly working = signal(false);

    readonly table: ServerTable<PaymentResponse> = new ServerTable<PaymentResponse>((paging) => {
        // The headline amounts describe the filtered set, not the page, so they are
        // re-read alongside it.
        this.loadSummary();
        return this.paymentService.getPayments({ ...paging, ...this.filters() });
    });

    statusFilter?: string;
    typeFilter?: string;

    paymentDialog = false;
    form: PaymentRequest = { team_id: 0, tournament_id: 0, amount: 0, external_id: '', type: 'enrollment' };

    ngOnInit() {
        // Both pickers need every option, so neither is paged.
        forkJoin({
            tournaments: this.tournamentService.getTournaments(),
            teams: this.teamService.getTeams()
        }).subscribe({
            next: ({ tournaments, teams }) => {
                this.tournaments.set(tournaments.data ?? []);
                this.teams.set(teams.data ?? []);
            }
        });
        // The lazy table loads the first page itself.
    }

    private filters(): PaymentFilters {
        return {
            status: this.statusFilter,
            type: this.typeFilter,
            search: this.table.search || undefined
        };
    }

    private loadSummary() {
        this.paymentService.getSummary(this.filters()).subscribe({
            next: (res) => this.summary.set(res.data ?? null),
            error: () => this.summary.set(null)
        });
    }

    isStaff(): boolean {
        return this.authService.isStaffOrAdmin();
    }

    subtitle(): string {
        return this.isStaff()
            ? 'Revisa y aprueba los comprobantes registrados por los delegados.'
            : 'Registra tus comprobantes y sigue su estado.';
    }

    statusOptions() {
        return this.catalogService.get('payment_statuses');
    }

    typeOptions() {
        return this.catalogService.get('payment_types');
    }

    statusLabel(status: string) {
        return this.catalogService.label('payment_statuses', status);
    }

    typeLabel(type: string) {
        return this.catalogService.label('payment_types', type);
    }

    tone(status: string) {
        return paymentStatusSeverity(status);
    }

    money(amount: number): string {
        return this.configService.currencySymbol() + (amount ?? 0).toFixed(2);
    }

    /** Headline amounts over every payment the filters match, computed by the API. */
    totals() {
        const summary = this.summary();
        return [
            { label: 'Aprobado', value: this.money(summary?.approved ?? 0) },
            { label: 'Pendiente', value: this.money(summary?.pending ?? 0) },
            { label: 'Rechazado', value: this.money(summary?.rejected ?? 0) },
            { label: 'Registros', value: String(summary?.count ?? 0) }
        ];
    }

    openNew() {
        this.form = {
            team_id: this.teams()[0]?.id ?? 0,
            tournament_id: this.tournaments()[0]?.id ?? 0,
            amount: 0,
            external_id: '',
            type: 'enrollment'
        };
        this.suggestAmount();
        this.paymentDialog = true;
    }

    onTournamentChange() {
        this.suggestAmount();
    }

    /** Prefills the enrollment fee so the delegate does not have to look it up. */
    suggestAmount() {
        if (this.form.type !== 'enrollment') return;
        const tournament = this.tournaments().find((t) => t.id === this.form.tournament_id);
        if (tournament?.enrollment_price) this.form.amount = tournament.enrollment_price;
    }

    save() {
        if (!this.form.team_id || !this.form.tournament_id || !this.form.amount) {
            this.messageService.add({ severity: 'warn', summary: 'Faltan datos', detail: 'Elige torneo, equipo y monto.' });
            return;
        }

        this.working.set(true);
        this.paymentService.createPayment(this.form).subscribe({
            next: (res) => {
                this.working.set(false);
                this.paymentDialog = false;
                const rejected = res.data?.status === 'rejected';
                this.messageService.add({
                    severity: rejected ? 'warn' : 'success',
                    summary: rejected ? 'Registrado pero rechazado' : 'Registrado',
                    detail: res.message ?? ''
                });
                this.table.refresh();
            },
            error: (err) => {
                this.working.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? 'No se pudo registrar el pago.' });
            }
        });
    }

    setStatus(payment: PaymentResponse, status: string) {
        this.paymentService.updatePaymentStatus(payment.id, status).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Listo', detail: 'Estado actualizado. Se notificó al delegado.' });
                this.table.refresh();
            },
            error: (err) =>
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? 'No se pudo actualizar.' })
        });
    }

    remove(payment: PaymentResponse) {
        this.confirmationService.confirm({
            header: 'Eliminar pago',
            message: `¿Eliminar el pago de ${this.money(payment.amount)} de ${payment.team?.name}?`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.paymentService.deletePayment(payment.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Pago eliminado.' });
                        this.table.refreshAfterDelete();
                    },
                    error: (err) =>
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? 'No se pudo eliminar.' })
                });
            }
        });
    }
}
