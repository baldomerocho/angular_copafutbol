import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ConfigService } from '../service/config.service';
import { Setting } from '../service/interfaces/config.interface';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        TextareaModule,
        DialogModule,
        ToastModule
    ],
    providers: [MessageService],
    templateUrl: './settings.html'
})
export class Settings implements OnInit {
    settings = signal<Setting[]>([]);
    loading: boolean = true;
    editDialog: boolean = false;
    currentSetting: any = { key: '', metadata: '' };
    metadataString: string = '';
    isValidJson: boolean = true;

    constructor(
        private configService: ConfigService,
        private messageService: MessageService
    ) { }

    ngOnInit() {
        this.loadSettings();
    }

    loadSettings() {
        this.loading = true;
        this.configService.getAdminSettings().subscribe({
            next: (res) => {
                this.settings.set(res.data || []);
                this.loading = false;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las configuraciones' });
                this.loading = false;
            }
        });
    }

    editSetting(setting: Setting) {
        this.currentSetting = { ...setting };
        this.metadataString = JSON.stringify(setting.metadata, null, 4);
        this.isValidJson = true;
        this.editDialog = true;
    }

    formatJson() {
        try {
            const obj = JSON.parse(this.metadataString);
            this.metadataString = JSON.stringify(obj, null, 4);
            this.isValidJson = true;
        } catch (e) {
            this.isValidJson = false;
            this.messageService.add({ severity: 'warn', summary: 'JSON Inválido', detail: 'No se pudo formatear el contenido' });
        }
    }

    saveSetting() {
        try {
            const metadata = JSON.parse(this.metadataString);
            this.loading = true;
            this.configService.updateSetting(this.currentSetting.key, metadata).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Configuración actualizada' });
                    this.loadSettings();
                    this.editDialog = false;
                    this.loading = false;
                },
                error: (err) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al actualizar' });
                    this.loading = false;
                }
            });
        } catch (e) {
            this.isValidJson = false;
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'El contenido no es un JSON válido' });
        }
    }

    hideDialog() {
        this.editDialog = false;
    }
}
