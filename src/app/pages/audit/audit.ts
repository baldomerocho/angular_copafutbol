import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { AuditLogResponse, AuditService } from '../service/audit.service';
import { Severity } from '../shared/status';

/** Who changed what, and when. Written by the API on every mutating action. */
@Component({
    selector: 'app-audit-logs',
    standalone: true,
    imports: [
        CommonModule, FormsModule, TableModule, ButtonModule, ToolbarModule, TagModule,
        DialogModule, InputTextModule, IconFieldModule, InputIconModule, SelectModule
    ],
    template: `
        <div class="card">
            <p-toolbar styleClass="mb-4">
                <ng-template pTemplate="start">
                    <div>
                        <h1 class="text-xl font-semibold m-0">Bitácora</h1>
                        <p class="text-muted-color text-sm mt-1 mb-0">Registro de cambios sobre torneos, partidos y sanciones.</p>
                    </div>
                </ng-template>
                <ng-template pTemplate="end">
                    <p-button label="Actualizar" icon="pi pi-refresh" severity="secondary" [text]="true" (onClick)="load()" />
                </ng-template>
            </p-toolbar>

            <div class="flex flex-wrap gap-3 mb-4">
                <p-select [options]="entities" [(ngModel)]="entity" placeholder="Toda entidad" appendTo="body"
                          [showClear]="true" (onChange)="reload()" styleClass="w-48" />
                <p-iconfield class="flex-1 max-w-md">
                    <p-inputicon class="pi pi-search" />
                    <input pInputText type="text" placeholder="Filtrar la página por acción o usuario" class="w-full"
                           (input)="applySearch($any($event.target).value)" />
                </p-iconfield>
            </div>

            <!--
                The bitácora only grows, so the server pages it. The search box filters
                the page you are looking at; the entity picker filters the whole table.
            -->
            <p-table [value]="filtered()" [lazy]="true" (onLazyLoad)="loadPage($event)"
                     [paginator]="true" [rows]="perPage" [totalRecords]="total()" [first]="first"
                     [rowsPerPageOptions]="[20, 50, 100]" [loading]="loading()"
                     currentPageReportTemplate="{first} - {last} de {totalRecords}"
                     [showCurrentPageReport]="true"
                     responsiveLayout="scroll" dataKey="id">
                <ng-template pTemplate="header">
                    <tr>
                        <th style="width: 12rem">Fecha</th>
                        <th>Acción</th>
                        <th>Entidad</th>
                        <th>Usuario</th>
                        <th style="width: 6rem">Detalle</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-log>
                    <tr>
                        <td class="text-sm whitespace-nowrap tabular-nums">{{ log.timestamp | date: 'dd/MM/yyyy HH:mm' }}</td>
                        <td><p-tag [value]="actionLabel(log.action)" [severity]="actionTone(log.action)" styleClass="text-xs" /></td>
                        <td class="text-sm">{{ log.entity }} <span class="text-muted-color">#{{ log.entity_id }}</span></td>
                        <td class="text-sm text-muted-color">{{ log.user_email || 'sistema' }}</td>
                        <td>
                            <p-button icon="pi pi-eye" [rounded]="true" [text]="true" size="small" (onClick)="open(log)" />
                        </td>
                    </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="5">
                            <div class="text-center py-10">
                                <i class="pi pi-history text-4xl text-muted-color mb-3 block"></i>
                                <div class="text-muted-color">Sin movimientos registrados.</div>
                            </div>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <p-dialog [(visible)]="detailDialog" [style]="{ width: '640px' }" [modal]="true" header="Detalle del cambio">
            @if (selected) {
                <div class="flex flex-col gap-4">
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div><span class="text-muted-color block">Acción</span>{{ selected.action }}</div>
                        <div><span class="text-muted-color block">Entidad</span>{{ selected.entity }} #{{ selected.entity_id }}</div>
                        <div><span class="text-muted-color block">Usuario</span>{{ selected.user_email || 'sistema' }}</div>
                        <div><span class="text-muted-color block">Fecha</span>{{ selected.timestamp | date: 'dd/MM/yyyy HH:mm:ss' }}</div>
                    </div>

                    <div>
                        <div class="text-muted-color text-sm mb-1">Antes</div>
                        <pre class="text-xs bg-emphasis p-3 rounded-border overflow-x-auto m-0">{{ pretty(selected.old_value) }}</pre>
                    </div>
                    <div>
                        <div class="text-muted-color text-sm mb-1">Después</div>
                        <pre class="text-xs bg-emphasis p-3 rounded-border overflow-x-auto m-0">{{ pretty(selected.new_value) }}</pre>
                    </div>
                </div>
            }
            <ng-template pTemplate="footer">
                <p-button label="Cerrar" [text]="true" (onClick)="detailDialog = false" />
            </ng-template>
        </p-dialog>
    `
})
export class AuditLogs implements OnInit {
    private readonly auditService = inject(AuditService);

    readonly logs = signal<AuditLogResponse[]>([]);
    readonly filtered = signal<AuditLogResponse[]>([]);
    readonly total = signal(0);
    readonly loading = signal(true);

    /** The entities the API writes trail entries for. */
    readonly entities = ['tournament', 'match', 'match_event', 'suspension', 'payment', 'team', 'user'];

    detailDialog = false;
    selected: AuditLogResponse | null = null;
    entity?: string;
    first = 0;
    perPage = 20;
    private search = '';

    ngOnInit() {
        // p-table fires onLazyLoad on init, which is what loads the first page.
    }

    /** Called by the table on paginate, and by us after a filter change. */
    loadPage(event: TableLazyLoadEvent) {
        this.first = event.first ?? 0;
        this.perPage = event.rows ?? this.perPage;
        this.load();
    }

    /** Back to page one — a narrower filter makes the old offset meaningless. */
    reload() {
        this.first = 0;
        this.load();
    }

    load() {
        this.loading.set(true);
        this.auditService
            .getLogs({
                page: Math.floor(this.first / this.perPage) + 1,
                per_page: this.perPage,
                entity: this.entity
            })
            .subscribe({
                next: (res) => {
                    this.logs.set(res.data ?? []);
                    this.total.set(res.meta?.total ?? (res.data ?? []).length);
                    this.applySearch(this.search);
                    this.loading.set(false);
                },
                error: () => this.loading.set(false)
            });
    }

    applySearch(term: string) {
        this.search = term ?? '';
        const needle = this.search.trim().toLowerCase();
        this.filtered.set(
            needle
                ? this.logs().filter((log) =>
                      [log.action, log.entity, log.user_email].some((field) => field?.toLowerCase().includes(needle))
                  )
                : this.logs()
        );
    }

    actionLabel(action: string): string {
        const labels: Record<string, string> = {
            CREATE_TOURNAMENT: 'Torneo creado',
            UPDATE_TOURNAMENT: 'Torneo actualizado',
            DELETE_TOURNAMENT: 'Torneo eliminado',
            GENERATE_FIXTURES: 'Calendario generado',
            GENERATE_KNOCKOUT: 'Llaves generadas',
            CLEAR_FIXTURES: 'Calendario borrado',
            CREATE_MATCH: 'Partido creado',
            UPDATE_MATCH: 'Partido actualizado',
            DELETE_MATCH: 'Partido eliminado',
            CREATE_MATCH_EVENT: 'Evento registrado',
            DELETE_MATCH_EVENT: 'Evento eliminado',
            UPDATE_SUSPENSION: 'Sanción actualizada'
        };
        return labels[action] ?? action;
    }

    actionTone(action: string): Severity {
        if (action.startsWith('DELETE') || action.startsWith('CLEAR')) return 'danger';
        if (action.startsWith('CREATE') || action.startsWith('GENERATE')) return 'success';
        return 'info';
    }

    open(log: AuditLogResponse) {
        this.selected = log;
        this.detailDialog = true;
    }

    /** Audit values are stored as JSON strings; show them formatted when possible. */
    pretty(value: string): string {
        if (!value || value === 'null') return '—';
        try {
            return JSON.stringify(JSON.parse(value), null, 2);
        } catch {
            return value;
        }
    }
}
