import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { DividerModule } from 'primeng/divider';
import { FluidModule } from 'primeng/fluid';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { CatalogService } from '../../service/catalog.service';
import { ConfigService } from '../../service/config.service';
import {
    DEFAULT_TOURNAMENT_RULES,
    TournamentRequest,
    TournamentResponse
} from '../../service/interfaces/tournament.interface';
import { TournamentService } from '../../service/tournament.service';

/**
 * Full tournament editor. Every rule the engine reads is editable here — points,
 * tiebreakers, card thresholds, scheduling cadence — because that is what makes one
 * deployment able to run a league, a cup and a hybrid at the same time.
 */
@Component({
    selector: 'app-tournament-management',
    standalone: true,
    imports: [
        CommonModule, FormsModule, RouterModule, ButtonModule, InputTextModule, InputNumberModule,
        DatePickerModule, SelectModule, MultiSelectModule, ToastModule, FluidModule, TextareaModule,
        CheckboxModule, ToggleSwitchModule, TabsModule, DividerModule, MessageModule
    ],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="card">
            <div class="flex flex-wrap justify-between items-start gap-4 mb-6">
                <div>
                    <h1 class="text-xl font-semibold m-0">{{ isEdit ? 'Editar torneo' : 'Nuevo torneo' }}</h1>
                    <p class="text-muted-color text-sm mt-1 mb-0">
                        Define el formato y las reglas. Todo esto se puede cambiar mientras el torneo no tenga partidos jugados.
                    </p>
                </div>
                <div class="flex gap-2">
                    <p-button label="Cancelar" severity="secondary" [text]="true" routerLink="/pages/tournaments" />
                    <p-button label="Guardar" icon="pi pi-check" [loading]="saving()" (onClick)="save()" />
                </div>
            </div>

            <p-tabs value="general">
                <p-tablist>
                    <p-tab value="general"><i class="pi pi-info-circle mr-2"></i>General</p-tab>
                    <p-tab value="format"><i class="pi pi-sitemap mr-2"></i>Formato y puntos</p-tab>
                    <p-tab value="discipline"><i class="pi pi-flag mr-2"></i>Disciplina</p-tab>
                    <p-tab value="schedule"><i class="pi pi-calendar mr-2"></i>Calendario</p-tab>
                    <p-tab value="money"><i class="pi pi-dollar mr-2"></i>Inscripción</p-tab>
                </p-tablist>

                <p-tabpanels>
                    <!-- General -->
                    <p-tabpanel value="general">
                        <p-fluid>
                            <div class="grid grid-cols-12 gap-4">
                                <div class="col-span-12 md:col-span-8 flex flex-col gap-2">
                                    <label class="font-medium">Nombre <span class="text-red-500">*</span></label>
                                    <input pInputText [(ngModel)]="tournament.name" placeholder="Copa Apertura" />
                                </div>
                                <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
                                    <label class="font-medium">Temporada</label>
                                    <input pInputText [(ngModel)]="tournament.season" placeholder="2026" />
                                </div>

                                <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                    <label class="font-medium">Formato</label>
                                    <p-select [options]="catalog('tournament_types')" [(ngModel)]="tournament.type"
                                              optionLabel="name" optionValue="id" appendTo="body" />
                                    <small class="text-muted-color">{{ typeHint() }}</small>
                                </div>
                                <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                    <label class="font-medium">Estado</label>
                                    <p-select [options]="catalog('tournament_statuses')" [(ngModel)]="tournament.status"
                                              optionLabel="name" optionValue="id" appendTo="body" />
                                    <small class="text-muted-color">Los borradores no aparecen en el portal público.</small>
                                </div>

                                <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                    <label class="font-medium">Fecha de inicio</label>
                                    <p-datepicker [(ngModel)]="startDate" dateFormat="dd/mm/yy" [showIcon]="true" appendTo="body" />
                                </div>
                                <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                    <label class="font-medium">Fecha de cierre</label>
                                    <p-datepicker [(ngModel)]="endDate" dateFormat="dd/mm/yy" [showIcon]="true" appendTo="body" />
                                </div>

                                <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                    <label class="font-medium">Sede principal</label>
                                    <input pInputText [(ngModel)]="tournament.location" placeholder="Complejo Deportivo Municipal" />
                                </div>
                                <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                    <label class="font-medium">Logo (URL)</label>
                                    <input pInputText [(ngModel)]="tournament.logo_url" placeholder="https://..." />
                                </div>

                                <div class="col-span-12 flex flex-col gap-2">
                                    <label class="font-medium">Descripción</label>
                                    <textarea pTextarea rows="3" [(ngModel)]="tournament.description"
                                              placeholder="Breve descripción del torneo"></textarea>
                                </div>
                            </div>
                        </p-fluid>
                    </p-tabpanel>

                    <!-- Formato y puntos -->
                    <p-tabpanel value="format">
                        <p-fluid>
                            <div class="grid grid-cols-12 gap-4">
                                <div class="col-span-12">
                                    <div class="font-medium text-lg mb-1">Puntuación</div>
                                    <p class="text-muted-color text-sm mt-0">Cuántos puntos otorga cada resultado en la fase regular.</p>
                                </div>
                                <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
                                    <label class="font-medium">Puntos por victoria</label>
                                    <p-inputnumber [(ngModel)]="tournament.points_win" [min]="0" [max]="10" [showButtons]="true" />
                                </div>
                                <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
                                    <label class="font-medium">Puntos por empate</label>
                                    <p-inputnumber [(ngModel)]="tournament.points_draw" [min]="0" [max]="10" [showButtons]="true" />
                                </div>
                                <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
                                    <label class="font-medium">Puntos por derrota</label>
                                    <p-inputnumber [(ngModel)]="tournament.points_loss" [min]="0" [max]="10" [showButtons]="true" />
                                </div>

                                <div class="col-span-12"><p-divider /></div>

                                <div class="col-span-12">
                                    <div class="font-medium text-lg mb-1">Desempates</div>
                                    <p class="text-muted-color text-sm mt-0">Se aplican en orden cuando dos equipos igualan en puntos.</p>
                                </div>
                                <div class="col-span-12 flex flex-col gap-2">
                                    <p-multiselect [options]="catalog('tiebreakers')" [(ngModel)]="tiebreakerList"
                                                   optionLabel="name" optionValue="id" display="chip" appendTo="body"
                                                   placeholder="Selecciona los criterios en orden" />
                                    <small class="text-muted-color">Orden actual: {{ tiebreakerSummary() }}</small>
                                </div>

                                <div class="col-span-12"><p-divider /></div>

                                <div class="col-span-12">
                                    <div class="font-medium text-lg mb-1">Estructura</div>
                                </div>
                                <div class="col-span-12 md:col-span-6 flex items-center gap-3">
                                    <p-toggleswitch [(ngModel)]="tournament.double_round" inputId="doubleRound" />
                                    <label for="doubleRound" class="cursor-pointer">
                                        <span class="font-medium">Ida y vuelta</span>
                                        <div class="text-muted-color text-sm">Cada cruce se juega dos veces, con localía invertida.</div>
                                    </label>
                                </div>
                                <div class="col-span-12 md:col-span-6 flex items-center gap-3">
                                    <p-toggleswitch [(ngModel)]="tournament.third_place_match" inputId="thirdPlace" />
                                    <label for="thirdPlace" class="cursor-pointer">
                                        <span class="font-medium">Partido por el tercer lugar</span>
                                        <div class="text-muted-color text-sm">Se juega entre los perdedores de semifinales.</div>
                                    </label>
                                </div>

                                <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                    <label class="font-medium">Clasifican por grupo</label>
                                    <p-inputnumber [(ngModel)]="tournament.advancing_count" [min]="0" [max]="16" [showButtons]="true" />
                                    <small class="text-muted-color">Cuántos equipos avanzan a la fase eliminatoria.</small>
                                </div>
                                <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                    <label class="font-medium">Partidos por llave</label>
                                    <p-inputnumber [(ngModel)]="tournament.knockout_legs" [min]="1" [max]="2" [showButtons]="true" />
                                    <small class="text-muted-color">1 = partido único, 2 = ida y vuelta.</small>
                                </div>
                            </div>
                        </p-fluid>
                    </p-tabpanel>

                    <!-- Disciplina -->
                    <p-tabpanel value="discipline">
                        <p-fluid>
                            <div class="grid grid-cols-12 gap-4">
                                <div class="col-span-12 flex items-center gap-3">
                                    <p-toggleswitch [(ngModel)]="tournament.fair_play_enabled" inputId="fairPlay" />
                                    <label for="fairPlay" class="cursor-pointer">
                                        <span class="font-medium">Contabilizar fair play</span>
                                        <div class="text-muted-color text-sm">Descuenta puntos de conducta por tarjeta, usado como desempate.</div>
                                    </label>
                                </div>

                                @if (tournament.fair_play_enabled) {
                                    <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                        <label class="font-medium">Penalización por amarilla</label>
                                        <p-inputnumber [(ngModel)]="tournament.fair_play_yellow_penalty" [min]="0" [max]="10" [showButtons]="true" />
                                    </div>
                                    <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                        <label class="font-medium">Penalización por roja</label>
                                        <p-inputnumber [(ngModel)]="tournament.fair_play_red_penalty" [min]="0" [max]="20" [showButtons]="true" />
                                    </div>
                                }

                                <div class="col-span-12"><p-divider /></div>

                                <div class="col-span-12">
                                    <div class="font-medium text-lg mb-1">Suspensiones</div>
                                    <p class="text-muted-color text-sm mt-0">Se aplican solas al registrar la tarjeta en la planilla.</p>
                                </div>
                                <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
                                    <label class="font-medium">Amarillas para suspender</label>
                                    <p-inputnumber [(ngModel)]="tournament.yellow_card_threshold" [min]="0" [max]="20" [showButtons]="true" />
                                    <small class="text-muted-color">0 desactiva la acumulación.</small>
                                </div>
                                <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
                                    <label class="font-medium">Partidos por acumulación</label>
                                    <p-inputnumber [(ngModel)]="tournament.yellow_suspension_games" [min]="1" [max]="10" [showButtons]="true" />
                                </div>
                                <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
                                    <label class="font-medium">Partidos por roja</label>
                                    <p-inputnumber [(ngModel)]="tournament.red_suspension_games" [min]="1" [max]="10" [showButtons]="true" />
                                </div>

                                <div class="col-span-12"><p-divider /></div>

                                <div class="col-span-12">
                                    <div class="font-medium text-lg mb-1">Plantillas</div>
                                </div>
                                <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                    <label class="font-medium">Jugadores mínimos</label>
                                    <p-inputnumber [(ngModel)]="tournament.min_players_per_team" [min]="1" [max]="30" [showButtons]="true" />
                                </div>
                                <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                    <label class="font-medium">Jugadores máximos</label>
                                    <p-inputnumber [(ngModel)]="tournament.max_players_per_team" [min]="1" [max]="60" [showButtons]="true" />
                                </div>
                            </div>
                        </p-fluid>
                    </p-tabpanel>

                    <!-- Calendario -->
                    <p-tabpanel value="schedule">
                        <p-fluid>
                            <div class="grid grid-cols-12 gap-4">
                                <div class="col-span-12">
                                    <p-message severity="secondary" icon="pi pi-info-circle" styleClass="w-full">
                                        Estos valores se usan al generar el calendario automático.
                                    </p-message>
                                </div>

                                <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                    <label class="font-medium">Día de juego</label>
                                    <p-select [options]="catalog('weekdays')" [(ngModel)]="schedulingDay"
                                              optionLabel="name" optionValue="id" appendTo="body" />
                                </div>
                                <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                    <label class="font-medium">Hora del primer partido</label>
                                    <p-inputnumber [(ngModel)]="tournament.scheduling_start_hour" [min]="0" [max]="23"
                                                   [showButtons]="true" suffix=":00" />
                                </div>

                                <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
                                    <label class="font-medium">Duración del partido</label>
                                    <p-inputnumber [(ngModel)]="tournament.match_duration_minutes" [min]="10" [max]="180"
                                                   [showButtons]="true" suffix=" min" />
                                    <small class="text-muted-color">Se usa para detectar choques de cancha.</small>
                                </div>
                                <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
                                    <label class="font-medium">Separación entre turnos</label>
                                    <p-inputnumber [(ngModel)]="tournament.slot_interval_minutes" [min]="10" [max]="300"
                                                   [showButtons]="true" suffix=" min" />
                                    <small class="text-muted-color">Cada cuánto arranca el siguiente partido en la misma cancha.</small>
                                </div>
                                <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
                                    <label class="font-medium">Días entre jornadas</label>
                                    <p-inputnumber [(ngModel)]="tournament.days_between_rounds" [min]="1" [max]="30" [showButtons]="true" />
                                </div>
                            </div>
                        </p-fluid>
                    </p-tabpanel>

                    <!-- Inscripción -->
                    <p-tabpanel value="money">
                        <p-fluid>
                            <div class="grid grid-cols-12 gap-4">
                                <div class="col-span-12 flex items-center gap-3">
                                    <p-toggleswitch [(ngModel)]="tournament.registration_open" inputId="regOpen" />
                                    <label for="regOpen" class="cursor-pointer">
                                        <span class="font-medium">Inscripción abierta</span>
                                        <div class="text-muted-color text-sm">Si está cerrada, ningún delegado puede inscribir equipos.</div>
                                    </label>
                                </div>

                                <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                    <label class="font-medium">Cuota de inscripción</label>
                                    <p-inputnumber [(ngModel)]="tournament.enrollment_price" mode="currency"
                                                   currency="USD" locale="es" [min]="0" />
                                </div>
                                <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                    <label class="font-medium">Cupo de equipos</label>
                                    <p-inputnumber [(ngModel)]="tournament.max_teams" [min]="0" [max]="128" [showButtons]="true" />
                                    <small class="text-muted-color">0 = sin límite.</small>
                                </div>

                                <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                    <label class="font-medium">Fecha límite de pago</label>
                                    <p-datepicker [(ngModel)]="paymentDeadline" dateFormat="dd/mm/yy" [showIcon]="true"
                                                  [showClear]="true" appendTo="body" />
                                    <small class="text-muted-color">Los pagos de inscripción después de esta fecha se rechazan solos.</small>
                                </div>
                                <div class="col-span-12 md:col-span-6 flex items-center gap-3">
                                    <p-toggleswitch [(ngModel)]="tournament.allow_late_payment" inputId="latePayment" />
                                    <label for="latePayment" class="cursor-pointer">
                                        <span class="font-medium">Permitir inscribir sin pagar</span>
                                        <div class="text-muted-color text-sm">Deja inscribir equipos con pagos pendientes.</div>
                                    </label>
                                </div>

                                <div class="col-span-12"><p-divider /></div>

                                <div class="col-span-12 flex justify-between items-center">
                                    <div>
                                        <div class="font-medium text-lg mb-1">Cobros adicionales</div>
                                        <p class="text-muted-color text-sm mt-0 mb-0">Uniformes, arbitraje, balones y demás.</p>
                                    </div>
                                    <p-button label="Agregar" icon="pi pi-plus" [text]="true" (onClick)="addExtraPrice()" />
                                </div>

                                @for (extra of tournament.extra_prices; track $index) {
                                    <div class="col-span-12 md:col-span-7 flex flex-col gap-2">
                                        <label class="font-medium text-sm">Concepto</label>
                                        <input pInputText [(ngModel)]="extra.name" placeholder="Juego de uniformes" />
                                    </div>
                                    <div class="col-span-9 md:col-span-4 flex flex-col gap-2">
                                        <label class="font-medium text-sm">Monto</label>
                                        <p-inputnumber [(ngModel)]="extra.amount" mode="currency" currency="USD" locale="es" [min]="0" />
                                    </div>
                                    <div class="col-span-3 md:col-span-1 flex items-end">
                                        <p-button icon="pi pi-trash" severity="danger" [text]="true" (onClick)="removeExtraPrice($index)" />
                                    </div>
                                } @empty {
                                    <div class="col-span-12 text-muted-color text-sm py-2">Sin cobros adicionales.</div>
                                }
                            </div>
                        </p-fluid>
                    </p-tabpanel>
                </p-tabpanels>
            </p-tabs>
        </div>
    `
})
export class TournamentManagement implements OnInit {
    private readonly tournamentService = inject(TournamentService);
    private readonly catalogService = inject(CatalogService);
    private readonly configService = inject(ConfigService);
    private readonly messageService = inject(MessageService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    tournament: TournamentRequest & { id?: number } = {
        name: '',
        season: String(new Date().getFullYear()),
        description: '',
        location: '',
        logo_url: '',
        status: 'draft',
        type: 'league',
        registration_open: true,
        enrollment_price: 0,
        max_teams: 0,
        allow_late_payment: false,
        extra_prices: [],
        ...DEFAULT_TOURNAMENT_RULES
    };

    isEdit = false;
    readonly saving = signal(false);

    startDate?: Date;
    endDate?: Date;
    paymentDeadline?: Date | null;
    tiebreakerList: string[] = DEFAULT_TOURNAMENT_RULES.tiebreakers.split(',');
    schedulingDay = String(DEFAULT_TOURNAMENT_RULES.scheduling_day);

    ngOnInit() {
        const id = this.route.snapshot.params['id'];
        if (id) {
            this.isEdit = true;
            this.load(Number(id));
        }
    }

    catalog(key: Parameters<CatalogService['get']>[0]) {
        return this.catalogService.get(key);
    }

    typeHint(): string {
        switch (this.tournament.type) {
            case 'league':
                return 'Todos contra todos, gana quien sume más puntos.';
            case 'knockout':
                return 'Eliminación directa desde la primera ronda.';
            default:
                return 'Fase de grupos y luego eliminación directa entre los clasificados.';
        }
    }

    tiebreakerSummary(): string {
        if (!this.tiebreakerList.length) return 'sin criterios (se ordena por nombre)';
        return this.tiebreakerList.map((id) => this.catalogService.label('tiebreakers', id)).join(' → ');
    }

    addExtraPrice() {
        this.tournament.extra_prices = [...(this.tournament.extra_prices ?? []), { name: '', amount: 0 }];
    }

    removeExtraPrice(index: number) {
        this.tournament.extra_prices = (this.tournament.extra_prices ?? []).filter((_, i) => i !== index);
    }

    private load(id: number) {
        this.tournamentService.getTournament(id).subscribe({
            next: (res) => {
                const data = res.data as TournamentResponse;
                this.tournament = {
                    ...data,
                    extra_prices: (data.extra_prices ?? []).map((extra) => ({ name: extra.name, amount: extra.amount }))
                };
                this.startDate = data.start_date ? new Date(data.start_date) : undefined;
                this.endDate = data.end_date ? new Date(data.end_date) : undefined;
                this.paymentDeadline = data.payment_deadline ? new Date(data.payment_deadline) : null;
                this.tiebreakerList = (data.tiebreakers || '').split(',').filter(Boolean);
                this.schedulingDay = String(data.scheduling_day ?? 6);
            },
            error: () =>
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el torneo.' })
        });
    }

    save() {
        if (!this.tournament.name?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Falta el nombre', detail: 'El torneo necesita un nombre.' });
            return;
        }
        if ((this.tournament.min_players_per_team ?? 0) > (this.tournament.max_players_per_team ?? 0)) {
            this.messageService.add({ severity: 'warn', summary: 'Revisa las plantillas', detail: 'El mínimo de jugadores supera al máximo.' });
            return;
        }

        const payload: TournamentRequest = {
            ...this.tournament,
            start_date: this.startDate?.toISOString(),
            end_date: this.endDate?.toISOString(),
            payment_deadline: this.paymentDeadline ? this.paymentDeadline.toISOString() : null,
            tiebreakers: this.tiebreakerList.join(','),
            scheduling_day: Number(this.schedulingDay),
            extra_prices: (this.tournament.extra_prices ?? []).filter((extra) => extra.name?.trim())
        };

        this.saving.set(true);
        const request = this.isEdit
            ? this.tournamentService.updateTournament(this.tournament.id!, payload)
            : this.tournamentService.createTournament(payload);

        request.subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Guardado',
                    detail: `Torneo ${this.isEdit ? 'actualizado' : 'creado'} correctamente.`
                });
                setTimeout(() => this.router.navigate(['/pages/tournaments']), 900);
            },
            error: (err) => {
                this.saving.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'No se pudo guardar',
                    detail: err.error?.message ?? 'Revisa los datos e inténtalo de nuevo.'
                });
            }
        });
    }
}
