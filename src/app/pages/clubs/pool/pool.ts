import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { CatalogService } from '../../service/catalog.service';
import { ClubService } from '../../service/club.service';
import { ClubPlayerRequest, ClubPlayerResponse, ClubResponse, TeamResponse } from '../../service/interfaces/team.interface';
import { PlayerService } from '../../service/player.service';
import { TeamService } from '../../service/team.service';

/**
 * The club's books: the people it can draw on, kept once instead of retyped for
 * every competition. Entering a tournament copies from here and then freezes, so
 * a past squad stays readable no matter who has joined or left since.
 */
@Component({
    selector: 'app-club-pool',
    standalone: true,
    imports: [
        CommonModule, FormsModule, RouterModule, TableModule, ButtonModule, InputTextModule,
        InputNumberModule, DatePickerModule, ToastModule, ToolbarModule, ConfirmDialogModule,
        TooltipModule, TagModule, DialogModule, SelectModule, MessageModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-confirmdialog [style]="{ width: '440px' }" />

        <div class="card">
            <p-toolbar styleClass="mb-4">
                <ng-template pTemplate="start">
                    <div>
                        <a routerLink="/pages/clubs" class="text-muted-color text-sm no-underline">
                            <i class="pi pi-arrow-left mr-1"></i>Clubes
                        </a>
                        <h1 class="text-xl font-semibold m-0 mt-1">Plantel de {{ club()?.name || '—' }}</h1>
                        <p class="text-muted-color text-sm mt-1 mb-0">
                            Las personas del club. Se mantienen una sola vez y se inscriben en cada torneo
                            desde aquí, sin volver a teclearlas.
                        </p>
                    </div>
                </ng-template>
                <ng-template pTemplate="end">
                    <div class="flex gap-2">
                        <p-button label="Inscribir en un torneo" icon="pi pi-sign-in" severity="secondary"
                                  [outlined]="true" (onClick)="openCopy()" [disabled]="!teams().length" />
                        <p-button label="Agregar jugador" icon="pi pi-plus" (onClick)="openNew()" />
                    </div>
                </ng-template>
            </p-toolbar>

            <p-table [value]="pool()" [rows]="25" [paginator]="pool().length > 25"
                     [loading]="loading()" responsiveLayout="scroll" dataKey="id">
                <ng-template pTemplate="header">
                    <tr>
                        <th style="width: 5rem" class="text-center">Dorsal</th>
                        <th>Jugador</th>
                        <th>Posición</th>
                        <th>Inscrito en</th>
                        <th style="width: 8rem">Acciones</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-member>
                    <tr [class.opacity-60]="!member.active">
                        <td class="text-center">
                            <div class="w-9 h-9 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center font-bold tabular-nums text-sm mx-auto">
                                {{ member.number || '—' }}
                            </div>
                        </td>
                        <td>
                            <a [routerLink]="['/publico/jugadores', member.player_id]"
                               class="font-medium no-underline text-color hover:underline">{{ member.player.name }}</a>
                            <div class="text-muted-color text-xs">
                                {{ member.player.document || 'Sin documento' }}
                                @if (member.player.age) { · {{ member.player.age }} años }
                                @if (!member.active) { · Ya no pertenece al club }
                            </div>
                        </td>
                        <td class="text-sm">{{ member.position ? positionLabel(member.position) : '—' }}</td>
                        <td>
                            @if (member.registered_in?.length) {
                                <div class="flex flex-wrap gap-1">
                                    @for (name of member.registered_in; track name) {
                                        <p-tag [value]="name" severity="info" styleClass="text-xs" />
                                    }
                                </div>
                            } @else {
                                <span class="text-muted-color text-sm">Libre</span>
                            }
                        </td>
                        <td>
                            <div class="flex gap-1">
                                <p-button icon="pi pi-pencil" [rounded]="true" [text]="true"
                                          pTooltip="Editar" tooltipPosition="top" (onClick)="openEdit(member)" />
                                <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger"
                                          pTooltip="Quitar del club" tooltipPosition="top" (onClick)="remove(member)" />
                            </div>
                        </td>
                    </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="5">
                            <div class="text-center py-10">
                                <i class="pi pi-users text-4xl text-muted-color mb-3 block"></i>
                                <div class="text-muted-color mb-4">El club todavía no tiene jugadores.</div>
                                <p-button label="Agregar jugador" icon="pi pi-plus" (onClick)="openNew()" />
                            </div>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- Alta y edición -->
        <p-dialog [(visible)]="dialog" [style]="{ width: '540px' }" [modal]="true"
                  [header]="form.player_id ? 'Editar jugador' : 'Agregar al plantel'">
            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-12 md:col-span-7 flex flex-col gap-2">
                    <label class="font-medium">Documento (DPI)</label>
                    <div class="flex gap-2">
                        <input pInputText [(ngModel)]="form.document" placeholder="1234567890101" class="flex-1"
                               [disabled]="!!form.player_id" />
                        @if (!form.player_id) {
                            <p-button icon="pi pi-search" severity="secondary" [outlined]="true"
                                      pTooltip="Buscar persona" tooltipPosition="top" (onClick)="lookup()" />
                        }
                    </div>
                    <small class="text-muted-color">
                        Búscalo primero: si ya jugó en otro club es la misma persona, no una nueva.
                    </small>
                </div>
                <div class="col-span-12 md:col-span-5 flex flex-col gap-2">
                    <label class="font-medium">Dorsal del club</label>
                    <p-inputnumber [(ngModel)]="form.number" [min]="0" [max]="99" [showButtons]="true" class="w-full" />
                    <small class="text-muted-color">Se propone al inscribirlo en un torneo.</small>
                </div>

                <div class="col-span-12 md:col-span-7 flex flex-col gap-2">
                    <label class="font-medium">Nombre <span class="text-red-500">*</span></label>
                    <input pInputText [(ngModel)]="form.name" placeholder="Juan Pérez" class="w-full" />
                </div>
                <div class="col-span-12 md:col-span-5 flex flex-col gap-2">
                    <label class="font-medium">Posición</label>
                    <p-select [options]="catalog('player_positions')" [(ngModel)]="form.position"
                              optionLabel="name" optionValue="id" placeholder="Sin definir" appendTo="body"
                              [showClear]="true" class="w-full" />
                </div>

                <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                    <label class="font-medium">Fecha de nacimiento</label>
                    <p-datepicker [(ngModel)]="birthDate" dateFormat="dd/mm/yy" [showIcon]="true"
                                  appendTo="body" [showClear]="true" class="w-full" />
                    <small class="text-muted-color">Necesaria si algún torneo limita por edad.</small>
                </div>
                <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                    <label class="font-medium">Teléfono</label>
                    <input pInputText [(ngModel)]="form.phone" placeholder="5555-5555" class="w-full" />
                </div>

                @if (form.player_id) {
                    <div class="col-span-12 flex items-center gap-3">
                        <p-select [options]="membershipOptions" [(ngModel)]="form.active" optionLabel="label"
                                  optionValue="value" appendTo="body" class="w-full sm:w-64" />
                        <span class="text-muted-color text-sm">
                            Darlo de baja no borra su historial en torneos pasados.
                        </span>
                    </div>
                }
            </div>

            <ng-template pTemplate="footer">
                <p-button label="Cancelar" [text]="true" (onClick)="dialog = false" />
                <p-button label="Guardar" icon="pi pi-check" [loading]="working()" (onClick)="save()" />
            </ng-template>
        </p-dialog>

        <!-- Inscribir el plantel en un torneo -->
        <p-dialog [(visible)]="copyDialog" [style]="{ width: '560px' }" [modal]="true" header="Inscribir en un torneo">
            <div class="flex flex-col gap-4">
                <p-message severity="secondary" icon="pi pi-info-circle" styleClass="w-full">
                    Se inscribe el plantel completo en el equipo que elijas. Quien ya esté en ese equipo se
                    omite, y quien necesite autorización queda inscrito pero sin poder jugar hasta que el
                    organizador lo apruebe.
                </p-message>

                <div class="flex flex-col gap-2">
                    <label class="font-medium">Equipo del club</label>
                    <p-select [options]="teams()" [(ngModel)]="copyTeamId" optionLabel="label" optionValue="id"
                              placeholder="Selecciona el equipo" appendTo="body" class="w-full" />
                </div>

                <div class="flex flex-col gap-2">
                    <label class="font-medium">Motivo (si hace falta autorización)</label>
                    <input pInputText [(ngModel)]="copyReason" placeholder="Plantilla de la temporada anterior" class="w-full" />
                </div>

                @if (copyResult(); as result) {
                    <div class="border border-surface rounded-border p-3 text-sm">
                        <div class="flex justify-between py-1">
                            <span class="text-muted-color">Inscritos</span>
                            <span class="tabular-nums font-semibold">{{ result.registered }}</span>
                        </div>
                        <div class="flex justify-between py-1">
                            <span class="text-muted-color">Pendientes de autorización</span>
                            <span class="tabular-nums">{{ result.pending_approval }}</span>
                        </div>
                        <div class="flex justify-between py-1">
                            <span class="text-muted-color">Ya estaban</span>
                            <span class="tabular-nums">{{ result.already_on }}</span>
                        </div>
                        @if (result.skipped.length) {
                            <div class="border-t border-surface mt-2 pt-2">
                                <div class="text-muted-color mb-1">No se pudieron inscribir:</div>
                                @for (skip of result.skipped; track skip.player_id) {
                                    <div class="text-xs py-1">
                                        <span class="font-medium">{{ skip.player_name }}</span> — {{ skip.reason }}
                                    </div>
                                }
                            </div>
                        }
                    </div>
                }
            </div>

            <ng-template pTemplate="footer">
                <p-button label="Cerrar" [text]="true" (onClick)="copyDialog = false" />
                <p-button label="Inscribir" icon="pi pi-check" [loading]="working()" (onClick)="copy()" />
            </ng-template>
        </p-dialog>
    `
})
export class ClubPool implements OnInit {
    private readonly clubService = inject(ClubService);
    private readonly teamService = inject(TeamService);
    private readonly playerService = inject(PlayerService);
    private readonly catalogService = inject(CatalogService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly route = inject(ActivatedRoute);

    readonly club = signal<ClubResponse | null>(null);
    readonly pool = signal<ClubPlayerResponse[]>([]);
    readonly teams = signal<{ id: number; label: string }[]>([]);
    readonly copyResult = signal<import('../../service/interfaces/team.interface').CopyPoolResponse | null>(null);
    readonly loading = signal(true);
    readonly working = signal(false);

    readonly membershipOptions = [
        { label: 'Pertenece al club', value: true },
        { label: 'Ya no pertenece', value: false }
    ];

    dialog = false;
    copyDialog = false;
    form: ClubPlayerRequest = { name: '', document: '', number: 0 };
    birthDate: Date | null = null;
    copyTeamId?: number;
    copyReason = '';

    private clubId = 0;

    ngOnInit() {
        this.clubId = Number(this.route.snapshot.params['id']);
        this.clubService.getClub(this.clubId).subscribe({
            next: (res) => {
                this.club.set(res.data ?? null);
                this.teams.set(
                    (res.data?.teams ?? []).map((team: TeamResponse) => ({
                        id: team.id,
                        label: `${team.name}${team.tournament?.name ? ' · ' + team.tournament.name : ' · sin torneo'}`
                    }))
                );
            }
        });
        this.load();
    }

    catalog(key: 'player_positions') {
        return this.catalogService.get(key);
    }

    positionLabel(position: string): string {
        return this.catalogService.label('player_positions', position);
    }

    load() {
        this.loading.set(true);
        this.clubService.getPool(this.clubId, true).subscribe({
            next: (res) => {
                this.pool.set(res.data ?? []);
                this.loading.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el plantel.' });
                this.loading.set(false);
            }
        });
    }

    openNew() {
        this.form = { name: '', document: '', number: 0 };
        this.birthDate = null;
        this.dialog = true;
    }

    openEdit(member: ClubPlayerResponse) {
        this.form = {
            player_id: member.player_id,
            name: member.player.name,
            document: member.player.document,
            position: member.position,
            number: member.number,
            phone: member.player.phone,
            active: member.active
        };
        this.birthDate = member.player.birth_date ? new Date(member.player.birth_date) : null;
        this.dialog = true;
    }

    /** Reuses the person when the document already exists, instead of storing them twice. */
    lookup() {
        const document = (this.form.document ?? '').trim();
        if (!document) {
            this.messageService.add({ severity: 'warn', summary: 'Falta el documento', detail: 'Escribe el DPI a buscar.' });
            return;
        }

        this.playerService.search({ document }).subscribe({
            next: (res) => {
                const found = (res.data ?? [])[0];
                if (!found) {
                    this.messageService.add({
                        severity: 'info',
                        summary: 'Sin coincidencias',
                        detail: 'No existe esa persona; complétala y se creará.'
                    });
                    return;
                }
                this.form.player_id = found.id;
                this.form.name = found.name;
                this.form.position = found.position;
                this.form.phone = found.phone;
                this.birthDate = found.birth_date ? new Date(found.birth_date) : null;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Persona encontrada',
                    detail: `${found.name} ya está registrada; se reutiliza su ficha.`
                });
            }
        });
    }

    save() {
        if (!this.form.name?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Falta el nombre', detail: 'El jugador necesita un nombre.' });
            return;
        }

        this.working.set(true);
        const payload: ClubPlayerRequest = {
            ...this.form,
            birth_date: this.birthDate ? this.birthDate.toISOString() : null
        };

        const request = this.form.player_id
            ? this.clubService.updatePoolPlayer(this.clubId, this.form.player_id, payload)
            : this.clubService.addToPool(this.clubId, payload);

        request.subscribe({
            next: () => {
                this.working.set(false);
                this.dialog = false;
                this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Plantel actualizado.' });
                this.load();
            },
            error: (err) => {
                this.working.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'No se pudo guardar',
                    detail: err.error?.message ?? 'Inténtalo de nuevo.'
                });
            }
        });
    }

    remove(member: ClubPlayerResponse) {
        this.confirmationService.confirm({
            header: 'Quitar del club',
            message: `${member.player.name} saldrá del plantel. Sus inscripciones pasadas no se tocan. ¿Continuar?`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Quitar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.clubService.removeFromPool(this.clubId, member.player_id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Listo', detail: 'Jugador quitado del club.' });
                        this.load();
                    },
                    error: (err) =>
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: err.error?.message ?? 'No se pudo quitar.'
                        })
                });
            }
        });
    }

    openCopy() {
        this.copyTeamId = this.teams()[0]?.id;
        this.copyReason = '';
        this.copyResult.set(null);
        this.copyDialog = true;
    }

    copy() {
        if (!this.copyTeamId) {
            this.messageService.add({ severity: 'warn', summary: 'Falta el equipo', detail: 'Elige a qué equipo inscribir.' });
            return;
        }

        this.working.set(true);
        this.clubService.copyToTeam(this.clubId, this.copyTeamId, [], this.copyReason).subscribe({
            next: (res) => {
                this.working.set(false);
                this.copyResult.set(res.data ?? null);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Inscripción realizada',
                    detail: `${res.data?.registered ?? 0} jugadores inscritos.`
                });
                this.load();
            },
            error: (err) => {
                this.working.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'No se pudo inscribir',
                    detail: err.error?.message ?? 'Inténtalo de nuevo.'
                });
            }
        });
    }
}
