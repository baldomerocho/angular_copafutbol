import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
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
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CatalogService } from '../../service/catalog.service';
import { PlayerResponse, RosterEntryResponse, TeamResponse } from '../../service/interfaces/team.interface';
import { TournamentResponse } from '../../service/interfaces/tournament.interface';
import { PlayerService } from '../../service/player.service';
import { TeamService } from '../../service/team.service';
import { TournamentService } from '../../service/tournament.service';

/**
 * A squad's roster. A player is a person who exists independently of any squad,
 * so registering one first looks them up by identity document — that is what
 * keeps the same human from becoming two records when they change clubs.
 */
@Component({
    selector: 'app-players',
    standalone: true,
    imports: [
        CommonModule, FormsModule, RouterModule, TableModule, ButtonModule, InputTextModule, InputNumberModule,
        DialogModule, ToastModule, ToolbarModule, ConfirmDialogModule, FluidModule, IconFieldModule,
        InputIconModule, TagModule, TooltipModule, MessageModule, SelectModule, DatePickerModule, ToggleSwitchModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-confirmdialog [style]="{ width: '440px' }" />

        <div class="card">
            <p-toolbar styleClass="mb-4">
                <ng-template pTemplate="start">
                    <div class="flex items-center gap-2">
                        <p-button icon="pi pi-arrow-left" [rounded]="true" [text]="true" routerLink="/pages/teams" />
                        <div>
                            <h1 class="text-xl font-semibold m-0">Plantilla · {{ team()?.name }}</h1>
                            <p class="text-muted-color text-sm mt-1 mb-0">{{ subtitle() }}</p>
                        </div>
                    </div>
                </ng-template>
                <ng-template pTemplate="end">
                    <p-button label="Inscribir jugador" icon="pi pi-plus" (onClick)="openNew()" />
                </ng-template>
            </p-toolbar>

            @if (suspendedNames(); as names) {
                @if (names) {
                    <p-message severity="warn" icon="pi pi-ban" styleClass="w-full mb-4">
                        Con sanción vigente: {{ names }}
                    </p-message>
                }
            }

            @if (squadWarning(); as warning) {
                <p-message severity="info" icon="pi pi-info-circle" styleClass="w-full mb-4">{{ warning }}</p-message>
            }

            <p-iconfield class="mb-4 block max-w-md">
                <p-inputicon class="pi pi-search" />
                <input pInputText type="text" placeholder="Buscar por nombre o documento" class="w-full"
                       (input)="applySearch($any($event.target).value)" />
            </p-iconfield>

            <p-table [value]="filtered()" [rows]="25" [paginator]="filtered().length > 25"
                     [loading]="loading()" responsiveLayout="scroll" dataKey="player_id">
                <ng-template pTemplate="header">
                    <tr>
                        <th style="width: 5rem">Dorsal</th>
                        <th>Jugador</th>
                        <th>Documento</th>
                        <th class="text-center">Edad</th>
                        <th>Posición</th>
                        <th>Estado</th>
                        <th style="width: 10rem">Acciones</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-entry>
                    <tr>
                        <td>
                            <span class="inline-flex items-center justify-center bg-emphasis rounded-full font-semibold tabular-nums"
                                  style="width: 2rem; height: 2rem">{{ entry.number }}</span>
                        </td>
                        <td>
                            <div class="font-medium flex items-center gap-2">
                                {{ entry.player.name }}
                                @if (entry.is_captain) {
                                    <i class="pi pi-star-fill text-yellow-500 text-xs" pTooltip="Capitán"></i>
                                }
                            </div>
                        </td>
                        <td class="text-muted-color text-sm font-mono">{{ entry.player.document || '—' }}</td>
                        <td class="text-center tabular-nums">{{ entry.player.age || '—' }}</td>
                        <td class="text-sm">{{ positionLabel(entry.position || entry.player.position) }}</td>
                        <td>
                            @if (entry.suspended) {
                                <p-tag value="Suspendido" severity="danger" />
                            } @else {
                                <p-tag value="Disponible" severity="success" />
                            }
                        </td>
                        <td>
                            <div class="flex gap-1">
                                <p-button icon="pi pi-user" [rounded]="true" [text]="true" severity="secondary"
                                          pTooltip="Ver ficha" tooltipPosition="top"
                                          [routerLink]="['/publico/jugadores', entry.player_id]" />
                                <p-button icon="pi pi-pencil" [rounded]="true" [text]="true"
                                          pTooltip="Editar" tooltipPosition="top" (onClick)="openEdit(entry)" />
                                <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger"
                                          pTooltip="Quitar de la plantilla" tooltipPosition="top" (onClick)="remove(entry)" />
                            </div>
                        </td>
                    </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="7">
                            <div class="text-center py-10">
                                <i class="pi pi-id-card text-4xl text-muted-color mb-3 block"></i>
                                <div class="text-muted-color mb-4">Esta plantilla está vacía.</div>
                                <p-button label="Inscribir al primer jugador" icon="pi pi-plus" (onClick)="openNew()" />
                            </div>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <p-dialog [(visible)]="playerDialog" [style]="{ width: '520px' }" [modal]="true"
                  [header]="editing ? 'Editar inscripción' : 'Inscribir jugador'">
            <p-fluid>
                <div class="flex flex-col gap-4">
                    @if (!editing) {
                        <div class="flex flex-col gap-2">
                            <label class="font-medium">Documento de identidad (DPI)</label>
                            <div class="flex gap-2">
                                <input pInputText [(ngModel)]="form.document" placeholder="1234567890101" class="flex-1" />
                                <p-button icon="pi pi-search" severity="secondary" [outlined]="true"
                                          pTooltip="Buscar persona" (onClick)="lookup()" [loading]="looking()" />
                            </div>
                            <small class="text-muted-color">
                                Si la persona ya está registrada, se reutiliza su ficha en lugar de duplicarla.
                            </small>
                        </div>

                        @if (matched()) {
                            <p-message severity="success" icon="pi pi-check-circle" styleClass="w-full">
                                Persona encontrada: {{ matched()!.name }}{{ matched()!.age ? ' · ' + matched()!.age + ' años' : '' }}
                            </p-message>
                        }
                    }

                    <div class="flex flex-col gap-2">
                        <label class="font-medium">Nombre <span class="text-red-500">*</span></label>
                        <input pInputText [(ngModel)]="form.name" placeholder="Nombre y apellido" [disabled]="!!matched()" />
                    </div>

                    <div class="grid grid-cols-12 gap-3">
                        <div class="col-span-6 flex flex-col gap-2">
                            <label class="font-medium">Fecha de nacimiento</label>
                            <p-datepicker [(ngModel)]="birthDate" dateFormat="dd/mm/yy" [showIcon]="true"
                                          appendTo="body" [maxDate]="today" [disabled]="!!matched()" />
                        </div>
                        <div class="col-span-6 flex flex-col gap-2">
                            <label class="font-medium">Teléfono</label>
                            <input pInputText [(ngModel)]="form.phone" placeholder="+502 0000 0000" />
                        </div>
                    </div>

                    <div class="grid grid-cols-12 gap-3">
                        <div class="col-span-5 flex flex-col gap-2">
                            <label class="font-medium">Dorsal <span class="text-red-500">*</span></label>
                            <p-inputnumber [(ngModel)]="form.number" [min]="1" [max]="99" [showButtons]="true" />
                        </div>
                        <div class="col-span-7 flex flex-col gap-2">
                            <label class="font-medium">Posición</label>
                            <p-select [options]="positions()" [(ngModel)]="form.position" optionLabel="name"
                                      optionValue="id" placeholder="Sin definir" appendTo="body" [showClear]="true" />
                        </div>
                    </div>

                    <div class="flex items-center gap-3">
                        <p-toggleswitch [(ngModel)]="form.is_captain" inputId="captain" />
                        <label for="captain" class="cursor-pointer">
                            <span class="font-medium">Capitán</span>
                            <div class="text-muted-color text-sm">Solo un jugador por plantilla lleva la cinta.</div>
                        </label>
                    </div>
                </div>
            </p-fluid>

            <ng-template pTemplate="footer">
                <p-button label="Cancelar" [text]="true" (onClick)="playerDialog = false" />
                <p-button label="Guardar" icon="pi pi-check" [loading]="working()" (onClick)="save()" />
            </ng-template>
        </p-dialog>
    `
})
export class Players implements OnInit {
    private readonly teamService = inject(TeamService);
    private readonly playerService = inject(PlayerService);
    private readonly tournamentService = inject(TournamentService);
    private readonly catalogService = inject(CatalogService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    readonly team = signal<TeamResponse | null>(null);
    readonly tournament = signal<TournamentResponse | null>(null);
    readonly roster = signal<RosterEntryResponse[]>([]);
    readonly filtered = signal<RosterEntryResponse[]>([]);
    readonly matched = signal<PlayerResponse | null>(null);
    readonly loading = signal(true);
    readonly working = signal(false);
    readonly looking = signal(false);

    teamId!: number;
    playerDialog = false;
    editing = false;
    editingPlayerId?: number;
    birthDate?: Date;
    readonly today = new Date();

    form = { name: '', document: '', phone: '', number: 1, position: '', is_captain: false };
    private search = '';

    ngOnInit() {
        this.teamId = Number(this.route.snapshot.params['id']);
        if (!this.teamId) {
            this.router.navigate(['/pages/teams']);
            return;
        }
        this.load();
    }

    load() {
        this.loading.set(true);
        this.teamService.getTeam(this.teamId).subscribe({
            next: (res) => {
                const team = res.data ?? null;
                this.team.set(team);

                // The tournament's rules decide what the form must demand.
                const tournamentId = team?.tournament_id;
                const tournament$ = tournamentId
                    ? this.tournamentService.getTournament(tournamentId).pipe(catchError(() => of({ data: null })))
                    : of({ data: null });

                forkJoin({
                    roster: this.teamService.getRoster(this.teamId),
                    tournament: tournament$
                }).subscribe({
                    next: ({ roster, tournament }) => {
                        this.roster.set(roster.data ?? []);
                        this.tournament.set((tournament.data as TournamentResponse) ?? null);
                        this.applySearch(this.search);
                        this.loading.set(false);
                    },
                    error: () => this.loading.set(false)
                });
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la plantilla.' });
                this.loading.set(false);
            }
        });
    }

    subtitle(): string {
        const team = this.team();
        const parts = [`${this.roster().length} jugadores`];
        if (team?.division) parts.push(team.division);
        if (team?.tournament?.name) parts.push(team.tournament.name);
        return parts.join(' · ');
    }

    /** Explains what the tournament expects from this squad, if anything is off. */
    squadWarning(): string {
        const tournament = this.tournament();
        if (!tournament) return '';

        const count = this.roster().length;
        if (tournament.min_players_per_team > 0 && count < tournament.min_players_per_team) {
            return `El torneo exige al menos ${tournament.min_players_per_team} jugadores inscritos; van ${count}.`;
        }
        if (tournament.max_players_per_team > 0 && count >= tournament.max_players_per_team) {
            return `La plantilla llegó al máximo de ${tournament.max_players_per_team} jugadores.`;
        }
        if (tournament.require_player_document) {
            const missing = this.roster().filter((e) => !e.player.document).length;
            if (missing > 0) return `${missing} jugador(es) sin documento; el torneo lo exige para poder alinearlos.`;
        }
        return '';
    }

    positions() {
        return this.catalogService.get('player_positions');
    }

    positionLabel(position?: string): string {
        return position ? this.catalogService.label('player_positions', position) : '—';
    }

    suspendedNames(): string {
        return this.roster()
            .filter((entry) => entry.suspended)
            .map((entry) => entry.player.name)
            .join(', ');
    }

    applySearch(term: string) {
        this.search = term ?? '';
        const needle = this.search.trim().toLowerCase();
        this.filtered.set(
            needle
                ? this.roster().filter((entry) =>
                      [entry.player.name, entry.player.document].some((field) => field?.toLowerCase().includes(needle))
                  )
                : this.roster()
        );
    }

    openNew() {
        this.editing = false;
        this.editingPlayerId = undefined;
        this.matched.set(null);
        this.birthDate = undefined;
        this.form = { name: '', document: '', phone: '', number: this.nextFreeNumber(), position: '', is_captain: false };
        this.playerDialog = true;
    }

    openEdit(entry: RosterEntryResponse) {
        this.editing = true;
        this.editingPlayerId = entry.player_id;
        this.matched.set(null);
        this.birthDate = entry.player.birth_date ? new Date(entry.player.birth_date) : undefined;
        this.form = {
            name: entry.player.name,
            document: entry.player.document ?? '',
            phone: entry.player.phone ?? '',
            number: entry.number,
            position: entry.position ?? entry.player.position ?? '',
            is_captain: entry.is_captain
        };
        this.playerDialog = true;
    }

    /** Looks the document up so an existing person is reused rather than duplicated. */
    lookup() {
        const document = this.form.document.trim();
        if (!document) {
            this.messageService.add({ severity: 'warn', summary: 'Falta el documento', detail: 'Escribe el DPI para buscar.' });
            return;
        }

        this.looking.set(true);
        this.playerService.search({ document }).subscribe({
            next: (res) => {
                this.looking.set(false);
                const found = (res.data ?? [])[0];
                if (!found) {
                    this.matched.set(null);
                    this.messageService.add({
                        severity: 'info',
                        summary: 'Sin coincidencias',
                        detail: 'No existe esa persona. Completa sus datos para crearla.'
                    });
                    return;
                }
                this.matched.set(found);
                this.form.name = found.name;
                this.form.phone = found.phone ?? this.form.phone;
                this.form.position = found.position ?? this.form.position;
                this.birthDate = found.birth_date ? new Date(found.birth_date) : undefined;
            },
            error: () => this.looking.set(false)
        });
    }

    /** Suggests the lowest shirt number nobody wears yet. */
    private nextFreeNumber(): number {
        const taken = new Set(this.roster().map((entry) => entry.number));
        for (let number = 1; number <= 99; number++) {
            if (!taken.has(number)) return number;
        }
        return 1;
    }

    save() {
        if (!this.form.name.trim() && !this.matched()) {
            this.messageService.add({ severity: 'warn', summary: 'Falta el nombre', detail: 'El jugador necesita un nombre.' });
            return;
        }
        if (!this.form.number) {
            this.messageService.add({ severity: 'warn', summary: 'Falta el dorsal', detail: 'Asigna un número de camiseta.' });
            return;
        }
        if (this.tournament()?.require_player_document && !this.form.document.trim() && !this.matched()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Falta el documento',
                detail: 'Este torneo exige documento de identidad para inscribir jugadores.'
            });
            return;
        }

        const payload = {
            player_id: this.matched()?.id,
            name: this.form.name.trim(),
            document: this.form.document.trim(),
            birth_date: this.birthDate ? this.birthDate.toISOString() : null,
            phone: this.form.phone.trim(),
            number: this.form.number,
            position: this.form.position,
            is_captain: this.form.is_captain
        };

        this.working.set(true);
        const request = this.editing && this.editingPlayerId
            ? this.teamService.updateRosterEntry(this.teamId, this.editingPlayerId, payload)
            : this.teamService.registerPlayer(this.teamId, payload);

        request.subscribe({
            next: () => {
                this.working.set(false);
                this.playerDialog = false;
                this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Plantilla actualizada.' });
                this.load();
            },
            error: (err: { error?: { message?: string } }) => {
                this.working.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'No se pudo guardar',
                    detail: err.error?.message ?? 'Inténtalo de nuevo.'
                });
            }
        });
    }

    remove(entry: RosterEntryResponse) {
        this.confirmationService.confirm({
            header: 'Quitar de la plantilla',
            message: `${entry.player.name} saldrá de esta plantilla. Su ficha se conserva y puede inscribirse en otro equipo.`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Quitar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.teamService.removePlayer(this.teamId, entry.player_id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Listo', detail: 'Jugador retirado de la plantilla.' });
                        this.load();
                    },
                    error: (err: { error?: { message?: string } }) =>
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? 'No se pudo quitar.' })
                });
            }
        });
    }
}
