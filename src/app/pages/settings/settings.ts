import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FluidModule } from 'primeng/fluid';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { ConfigService } from '../service/config.service';
import { AppConfig, Setting } from '../service/interfaces/config.interface';

/**
 * Platform settings. `app` gets a real form because it drives the branding every
 * user sees; the rest are provider credentials edited as raw JSON.
 */
@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [
        CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, TextareaModule,
        DialogModule, ToastModule, ToolbarModule, TagModule, FluidModule, MessageModule
    ],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="card">
            <div class="flex flex-wrap justify-between items-start gap-4 mb-6">
                <div>
                    <h1 class="text-xl font-semibold m-0">Identidad de la plataforma</h1>
                    <p class="text-muted-color text-sm mt-1 mb-0">Nombre, logo y color que ven todos los usuarios.</p>
                </div>
                <p-button label="Guardar identidad" icon="pi pi-check" [loading]="savingApp()" (onClick)="saveApp()" />
            </div>

            <p-fluid>
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                        <label class="font-medium">Nombre de la plataforma</label>
                        <input pInputText [(ngModel)]="appForm.platform_name" placeholder="Copa Fútbol" />
                    </div>
                    <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                        <label class="font-medium">Logo (URL)</label>
                        <input pInputText [(ngModel)]="appForm.logo_url" placeholder="https://..." />
                    </div>
                    <div class="col-span-6 md:col-span-3 flex flex-col gap-2">
                        <label class="font-medium">Símbolo de moneda</label>
                        <input pInputText [(ngModel)]="appForm.currency_symbol" placeholder="$" />
                    </div>
                    <div class="col-span-6 md:col-span-3 flex flex-col gap-2">
                        <label class="font-medium">Color principal</label>
                        <div class="flex gap-2 items-center">
                            <input type="color" [(ngModel)]="appForm.primary_color" class="h-10 w-14 rounded border border-surface cursor-pointer" />
                            <input pInputText [(ngModel)]="appForm.primary_color" class="flex-1" />
                        </div>
                    </div>
                    <div class="col-span-12 md:col-span-3 flex flex-col gap-2">
                        <label class="font-medium">Correo de contacto</label>
                        <input pInputText [(ngModel)]="appForm.contact_email" placeholder="contacto@liga.com" />
                    </div>
                    <div class="col-span-12 md:col-span-3 flex flex-col gap-2">
                        <label class="font-medium">Teléfono de contacto</label>
                        <input pInputText [(ngModel)]="appForm.contact_phone" placeholder="+502 0000 0000" />
                    </div>
                </div>
            </p-fluid>
        </div>

        <div class="card">
            <p-toolbar styleClass="mb-4">
                <ng-template pTemplate="start">
                    <div>
                        <h2 class="text-lg font-semibold m-0">Configuraciones avanzadas</h2>
                        <p class="text-muted-color text-sm mt-1 mb-0">
                            Proveedores de notificación y catálogos. Se editan como JSON.
                        </p>
                    </div>
                </ng-template>
                <ng-template pTemplate="end">
                    <p-button label="Actualizar" icon="pi pi-refresh" severity="secondary" [text]="true" (onClick)="load()" />
                </ng-template>
            </p-toolbar>

            <p-table [value]="settings()" [loading]="loading()" responsiveLayout="scroll" dataKey="key">
                <ng-template pTemplate="header">
                    <tr>
                        <th>Clave</th>
                        <th>Estado</th>
                        <th style="width: 8rem">Acciones</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-setting>
                    <tr>
                        <td class="font-medium font-mono text-sm">{{ setting.key }}</td>
                        <td>
                            @if (isConfigured(setting)) {
                                <p-tag value="Configurado" severity="success" />
                            } @else {
                                <p-tag value="Sin configurar" severity="secondary" />
                            }
                        </td>
                        <td>
                            <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" (onClick)="openEdit(setting)" />
                        </td>
                    </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                    <tr><td colspan="3" class="text-center py-8 text-muted-color">Sin configuraciones.</td></tr>
                </ng-template>
            </p-table>
        </div>

        <p-dialog [(visible)]="editDialog" [style]="{ width: '640px' }" [modal]="true"
                  [header]="'Editar ' + (current?.key || '')">
            <div class="flex flex-col gap-3">
                @if (current?.key === 'catalogs') {
                    <p-message severity="warn" icon="pi pi-exclamation-triangle" styleClass="w-full">
                        Los catálogos se regeneran en cada arranque del servidor. Los cambios manuales se perderán.
                    </p-message>
                }

                <textarea pTextarea rows="16" [(ngModel)]="metadataJson" class="w-full font-mono text-sm"
                          [class.border-red-500]="!validJson" (input)="validate()"></textarea>

                @if (!validJson) {
                    <small class="text-red-500">El contenido no es un JSON válido.</small>
                }
            </div>

            <ng-template pTemplate="footer">
                <p-button label="Formatear" icon="pi pi-align-left" severity="secondary" [text]="true" (onClick)="format()" />
                <p-button label="Cancelar" [text]="true" (onClick)="editDialog = false" />
                <p-button label="Guardar" icon="pi pi-check" [disabled]="!validJson" [loading]="saving()" (onClick)="save()" />
            </ng-template>
        </p-dialog>
    `
})
export class Settings implements OnInit {
    private readonly configService = inject(ConfigService);
    private readonly messageService = inject(MessageService);

    readonly settings = signal<Setting[]>([]);
    readonly loading = signal(true);
    readonly saving = signal(false);
    readonly savingApp = signal(false);

    appForm: AppConfig & { contact_email?: string; contact_phone?: string } = {
        platform_name: '',
        logo_url: '',
        currency_symbol: '$',
        primary_color: '#1d6a47'
    };

    editDialog = false;
    current: Setting | null = null;
    metadataJson = '';
    validJson = true;

    ngOnInit() {
        this.load();
    }

    load() {
        this.loading.set(true);
        this.configService.getSettings().subscribe({
            next: (res) => {
                const all = res.data ?? [];
                this.settings.set(all);

                const app = all.find((setting) => setting.key === 'app');
                if (app?.metadata) {
                    this.appForm = { ...this.appForm, ...(app.metadata as unknown as AppConfig) };
                }
                this.loading.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las configuraciones.' });
                this.loading.set(false);
            }
        });
    }

    isConfigured(setting: Setting): boolean {
        const metadata = setting.metadata;
        return !!metadata && Object.keys(metadata).length > 0;
    }

    saveApp() {
        this.savingApp.set(true);
        this.configService.updateSetting('app', this.appForm).subscribe({
            next: () => {
                this.savingApp.set(false);
                this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Identidad actualizada.' });
                // Re-fetch so the topbar and colours pick up the change without a reload.
                this.configService.fetchAppConfig().subscribe();
                this.load();
            },
            error: (err) => {
                this.savingApp.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? 'No se pudo guardar.' });
            }
        });
    }

    openEdit(setting: Setting) {
        this.current = setting;
        this.metadataJson = JSON.stringify(setting.metadata ?? {}, null, 4);
        this.validJson = true;
        this.editDialog = true;
    }

    validate() {
        try {
            JSON.parse(this.metadataJson);
            this.validJson = true;
        } catch {
            this.validJson = false;
        }
    }

    format() {
        try {
            this.metadataJson = JSON.stringify(JSON.parse(this.metadataJson), null, 4);
            this.validJson = true;
        } catch {
            this.validJson = false;
            this.messageService.add({ severity: 'warn', summary: 'JSON inválido', detail: 'No se pudo formatear.' });
        }
    }

    save() {
        if (!this.current) return;

        let metadata: unknown;
        try {
            metadata = JSON.parse(this.metadataJson);
        } catch {
            this.validJson = false;
            return;
        }

        this.saving.set(true);
        this.configService.updateSetting(this.current.key, metadata).subscribe({
            next: () => {
                this.saving.set(false);
                this.editDialog = false;
                this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Configuración actualizada.' });
                this.load();
            },
            error: (err) => {
                this.saving.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? 'No se pudo guardar.' });
            }
        });
    }
}
