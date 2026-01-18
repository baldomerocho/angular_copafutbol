import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { FluidModule } from 'primeng/fluid';
import { FieldService } from '../service/field.service';
import { FieldResponse, FieldRequest } from '../service/interfaces/field.interface';

@Component({
    selector: 'app-fields',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, DialogModule, ToastModule, ToolbarModule, ConfirmDialogModule, FluidModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './fields.html',
    styleUrl: './fields.css'
})
export class Fields implements OnInit {
    fields: FieldResponse[] = [];
    field: any = { name: '', location: '', capacity: undefined };
    fieldDialog: boolean = false;
    loading: boolean = true;

    constructor(
        private fieldService: FieldService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) { }

    ngOnInit() {
        this.loadFields();
    }

    loadFields() {
        this.loading = true;
        this.fieldService.getFields().subscribe({
            next: (res) => {
                this.fields = res.data || [];
                this.loading = false;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las sedes' });
                this.loading = false;
            }
        });
    }

    openNew() {
        this.field = { name: '' };
        this.fieldDialog = true;
    }

    editField(field: FieldResponse) {
        this.field = { ...field };
        this.fieldDialog = true;
    }

    deleteField(field: FieldResponse) {
        this.confirmationService.confirm({
            message: '¿Está seguro de que desea eliminar ' + field.name + '?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.fieldService.deleteField(field.id!).subscribe(() => {
                    this.messageService.add({ severity: 'success', summary: 'Sede eliminada', detail: '' });
                    this.loadFields();
                });
            }
        });
    }

    hideDialog() {
        this.fieldDialog = false;
    }

    saveField() {
        if (this.field.name.trim()) {
            const request: FieldRequest = {
                name: this.field.name,
                location: this.field.location,
                capacity: this.field.capacity
            };
            if (this.field.id) {
                this.fieldService.updateField(this.field.id, request).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Sede actualizada', detail: '' });
                        this.loadFields();
                        this.fieldDialog = false;
                    }
                });
            } else {
                this.fieldService.createField(request).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Sede creada', detail: '' });
                        this.loadFields();
                        this.fieldDialog = false;
                    }
                });
            }
        }
    }
}
