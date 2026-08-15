import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { FluidModule } from 'primeng/fluid';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { FieldRequest, FieldResponse } from '../service/interfaces/field.interface';
import { FieldService } from '../service/field.service';
import { ServerTable } from '../shared/server-table';

/** Venues. The calendar generator spreads matches across whatever is listed here. */
@Component({
    selector: 'app-fields',
    standalone: true,
    imports: [
        CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, InputNumberModule,
        DialogModule, ToastModule, ToolbarModule, ConfirmDialogModule, FluidModule, TooltipModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-confirmdialog [style]="{ width: '440px' }" />

        <div class="card">
            <p-toolbar styleClass="mb-4">
                <ng-template pTemplate="start">
                    <div>
                        <h1 class="text-xl font-semibold m-0">Sedes</h1>
                        <p class="text-muted-color text-sm mt-1 mb-0">
                            El generador de calendario reparte los partidos entre estas canchas.
                        </p>
                    </div>
                </ng-template>
                <ng-template pTemplate="end">
                    <p-button label="Nueva sede" icon="pi pi-plus" (onClick)="openNew()" />
                </ng-template>
            </p-toolbar>

            <p-table [value]="table.rows()" [lazy]="true" (onLazyLoad)="table.onLazyLoad($event)"
                     [paginator]="true" [rows]="table.perPage" [totalRecords]="table.total()" [first]="table.first"
                     [rowsPerPageOptions]="[15, 30, 60]" [loading]="table.loading()"
                     currentPageReportTemplate="{first} - {last} de {totalRecords}" [showCurrentPageReport]="true"
                     responsiveLayout="scroll" dataKey="id">
                <ng-template pTemplate="header">
                    <tr>
                        <th>Nombre</th>
                        <th>Ubicación</th>
                        <th class="text-center">Capacidad</th>
                        <th style="width: 8rem">Acciones</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-field>
                    <tr>
                        <td class="font-medium">{{ field.name }}</td>
                        <td class="text-muted-color">{{ field.location || '—' }}</td>
                        <td class="text-center tabular-nums">{{ field.capacity || '—' }}</td>
                        <td>
                            <div class="flex gap-1">
                                <p-button icon="pi pi-pencil" [rounded]="true" [text]="true"
                                          pTooltip="Editar" tooltipPosition="top" (onClick)="openEdit(field)" />
                                <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger"
                                          pTooltip="Eliminar" tooltipPosition="top" (onClick)="remove(field)" />
                            </div>
                        </td>
                    </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="4">
                            <div class="text-center py-10">
                                <i class="pi pi-map-marker text-4xl text-muted-color mb-3 block"></i>
                                <div class="text-muted-color mb-4">
                                    No hay sedes registradas. Sin al menos una, no se puede generar calendario.
                                </div>
                                <p-button label="Registrar la primera" icon="pi pi-plus" (onClick)="openNew()" />
                            </div>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <p-dialog [(visible)]="fieldDialog" [style]="{ width: '440px' }" [modal]="true"
                  [header]="editing ? 'Editar sede' : 'Nueva sede'">
            <p-fluid>
                <div class="flex flex-col gap-4">
                    <div class="flex flex-col gap-2">
                        <label class="font-medium">Nombre <span class="text-red-500">*</span></label>
                        <input pInputText [(ngModel)]="form.name" placeholder="Estadio Municipal" />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="font-medium">Ubicación</label>
                        <input pInputText [(ngModel)]="form.location" placeholder="Sector Norte" />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="font-medium">Capacidad</label>
                        <p-inputnumber [(ngModel)]="form.capacity" [min]="0" [showButtons]="true" />
                    </div>
                </div>
            </p-fluid>

            <ng-template pTemplate="footer">
                <p-button label="Cancelar" [text]="true" (onClick)="fieldDialog = false" />
                <p-button label="Guardar" icon="pi pi-check" [loading]="working()" (onClick)="save()" />
            </ng-template>
        </p-dialog>
    `
})
export class Fields implements OnInit {
    private readonly fieldService = inject(FieldService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    readonly working = signal(false);

    readonly table: ServerTable<FieldResponse> = new ServerTable<FieldResponse>((paging) =>
        this.fieldService.getFields(paging)
    );

    fieldDialog = false;
    editing = false;
    editingId?: number;
    form: FieldRequest = { name: '', location: '', capacity: 0 };

    ngOnInit() {
        // The lazy table loads the first page itself.
    }

    openNew() {
        this.editing = false;
        this.editingId = undefined;
        this.form = { name: '', location: '', capacity: 0 };
        this.fieldDialog = true;
    }

    openEdit(field: FieldResponse) {
        this.editing = true;
        this.editingId = field.id;
        this.form = { name: field.name, location: field.location ?? '', capacity: field.capacity ?? 0 };
        this.fieldDialog = true;
    }

    save() {
        if (!this.form.name?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Falta el nombre', detail: 'La sede necesita un nombre.' });
            return;
        }

        this.working.set(true);
        const request = this.editing && this.editingId
            ? this.fieldService.updateField(this.editingId, this.form)
            : this.fieldService.createField(this.form);

        request.subscribe({
            next: () => {
                this.working.set(false);
                this.fieldDialog = false;
                this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Sede guardada.' });
                this.table.refresh();
            },
            error: (err) => {
                this.working.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? 'No se pudo guardar la sede.' });
            }
        });
    }

    remove(field: FieldResponse) {
        this.confirmationService.confirm({
            header: 'Eliminar sede',
            message: `¿Eliminar "${field.name}"? No se puede si tiene partidos asignados.`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.fieldService.deleteField(field.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Eliminada', detail: 'Sede eliminada.' });
                        this.table.refreshAfterDelete();
                    },
                    error: (err) =>
                        this.messageService.add({
                            severity: 'error',
                            summary: 'No se pudo eliminar',
                            detail: err.error?.message ?? 'La sede podría tener partidos asignados.'
                        })
                });
            }
        });
    }
}
