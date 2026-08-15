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
    TournamentFeeRequest,
    TournamentRequest,
    TournamentResponse
} from '../../service/interfaces/tournament.interface';

/** The tournament fields that hold an eligibility policy. */
type EligibilityRuleKey =
    | 'policy_other_team_same_tournament'
    | 'policy_other_active_tournament'
    | 'policy_missing_document'
    | 'policy_outside_age_range';
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
                                    <small class="text-muted-color">1 = partido único, 2 = ida y vuelta. La final siempre es a un partido.</small>
                                </div>

                                <div class="col-span-12 flex flex-col gap-2">
                                    <label class="font-medium">Si una llave termina empatada</label>
                                    <p-multiselect [options]="catalog('knockout_tiebreaks')" [(ngModel)]="knockoutTiebreakList"
                                                   optionLabel="name" optionValue="id" display="chip" appendTo="body"
                                                   placeholder="Selecciona los criterios en orden" />
                                    <small class="text-muted-color">
                                        Orden actual: {{ knockoutSummary() }}. Sin criterios, el organizador tiene que
                                        registrar el desempate a mano.
                                    </small>
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
                                    <div class="font-medium text-lg mb-1">Plantillas e inscripción de jugadores</div>
                                    <p class="text-muted-color text-sm mt-0">Quién puede ser inscrito y cuántos.</p>
                                </div>
                                <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                    <label class="font-medium">Jugadores mínimos</label>
                                    <p-inputnumber [(ngModel)]="tournament.min_players_per_team" [min]="1" [max]="30" [showButtons]="true" />
                                    <small class="text-muted-color">Un equipo con menos no puede inscribirse.</small>
                                </div>
                                <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                    <label class="font-medium">Jugadores máximos</label>
                                    <p-inputnumber [(ngModel)]="tournament.max_players_per_team" [min]="1" [max]="60" [showButtons]="true" />
                                </div>

                                <div class="col-span-12"><p-divider /></div>

                                <div class="col-span-12">
                                    <div class="font-medium text-lg mb-1">Reglas de elegibilidad</div>
                                    <p class="text-muted-color text-sm mt-0">
                                        Qué pasa cuando un jugador rompe cada regla. <strong>Requiere autorización</strong>
                                        lo inscribe pero sin poder jugar hasta que tú lo apruebes, y puedes cobrarlo
                                        desde el tarifario.
                                    </p>
                                </div>

                                @for (rule of eligibilityRules; track rule.key) {
                                    <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                        <label class="font-medium">{{ rule.label }}</label>
                                        <p-select [options]="catalog('eligibility_policies')" [(ngModel)]="tournament[rule.key]"
                                                  optionLabel="name" optionValue="id" appendTo="body" />
                                        <small class="text-muted-color">{{ rule.hint }}</small>
                                        @if (tournament[rule.key] === 'requires_approval') {
                                            <small class="text-primary">
                                                <i class="pi pi-dollar text-xs mr-1"></i>{{ feeHint(rule.key) }}
                                            </small>
                                        }
                                    </div>
                                }

                                <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                    <label class="font-medium">Edad mínima</label>
                                    <p-inputnumber [(ngModel)]="tournament.min_player_age" [min]="0" [max]="80" [showButtons]="true" />
                                    <small class="text-muted-color">0 = sin límite.</small>
                                </div>
                                <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                    <label class="font-medium">Edad máxima</label>
                                    <p-inputnumber [(ngModel)]="tournament.max_player_age" [min]="0" [max]="80" [showButtons]="true" />
                                    <small class="text-muted-color">0 = sin límite.</small>
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

                                <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
                                    <label class="font-medium">Moneda</label>
                                    <p-select [options]="catalog('currencies')" [(ngModel)]="tournament.currency"
                                              optionLabel="name" optionValue="id" appendTo="body" />
                                    <small class="text-muted-color">Todos los montos de este torneo se cobran en ella.</small>
                                </div>
                                <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
                                    <label class="font-medium">Cuota de inscripción</label>
                                    <p-inputnumber [(ngModel)]="tournament.enrollment_price" [min]="0"
                                                   [minFractionDigits]="2" [suffix]="' ' + (tournament.currency || '')" />
                                </div>
                                <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
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
                                        <div class="font-medium text-lg mb-1">Tarifario</div>
                                        <p class="text-muted-color text-sm mt-0 mb-0">
                                            Todo lo que este torneo cobra. Lo <strong>obligatorio</strong> lo debe todo
                                            equipo al inscribirse; lo demás solo se cobra cuando aplica, como el permiso
                                            de una regla que tú autorizas.
                                        </p>
                                    </div>
                                    <p-button label="Agregar" icon="pi pi-plus" [text]="true" (onClick)="addFee()" />
                                </div>

                                @for (fee of tournament.fees; track $index) {
                                    <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
                                        <label class="font-medium text-sm">Concepto</label>
                                        <p-select [options]="catalog('fee_codes')" [(ngModel)]="fee.code"
                                                  optionLabel="name" optionValue="id" appendTo="body"
                                                  [editable]="true" (onChange)="nameFee(fee)" placeholder="Código" />
                                    </div>
                                    <div class="col-span-12 md:col-span-3 flex flex-col gap-2">
                                        <label class="font-medium text-sm">Nombre visible</label>
                                        <input pInputText [(ngModel)]="fee.name" placeholder="Juego de uniformes" />
                                    </div>
                                    <div class="col-span-6 md:col-span-2 flex flex-col gap-2">
                                        <label class="font-medium text-sm">Monto</label>
                                        <p-inputnumber [(ngModel)]="fee.amount" [min]="0" [minFractionDigits]="2" />
                                    </div>
                                    <div class="col-span-4 md:col-span-2 flex flex-col gap-2">
                                        <label class="font-medium text-sm">Obligatorio</label>
                                        <p-toggleswitch [(ngModel)]="fee.mandatory" />
                                    </div>
                                    <div class="col-span-2 md:col-span-1 flex items-end">
                                        <p-button icon="pi pi-trash" severity="danger" [text]="true" (onClick)="removeFee($index)" />
                                    </div>
                                } @empty {
                                    <div class="col-span-12 text-muted-color text-sm py-2">Sin cobros configurados.</div>
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
        currency: 'GTQ',
        fees: [],
        ...DEFAULT_TOURNAMENT_RULES
    };

    isEdit = false;
    readonly saving = signal(false);

    startDate?: Date;
    endDate?: Date;
    paymentDeadline?: Date | null;
    tiebreakerList: string[] = DEFAULT_TOURNAMENT_RULES.tiebreakers.split(',');
    knockoutTiebreakList: string[] = DEFAULT_TOURNAMENT_RULES.knockout_tiebreaks.split(',');
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

    knockoutSummary(): string {
        if (!this.knockoutTiebreakList.length) return 'sin resolución automática';
        return this.knockoutTiebreakList.map((id) => this.catalogService.label('knockout_tiebreaks', id)).join(' → ');
    }

    /** The squad rules, and what each one is asking the organizer to decide. */
    readonly eligibilityRules: { key: EligibilityRuleKey; label: string; hint: string }[] = [
        {
            key: 'policy_other_team_same_tournament',
            label: 'Ya juega en otro equipo de este torneo',
            hint: 'Bloquéalo salvo que corras primera y reserva compartiendo jugadores.'
        },
        {
            key: 'policy_other_active_tournament',
            label: 'Ya juega en otro torneo activo',
            hint: 'La copa y la liga son competencias distintas; suele permitirse.'
        },
        {
            key: 'policy_missing_document',
            label: 'No tiene documento (DPI)',
            hint: 'Útil cuando alguien aún no entrega papeles.'
        },
        {
            key: 'policy_outside_age_range',
            label: 'Fuera del rango de edad',
            hint: 'Usa el rango de arriba; sin rango esta regla no se aplica.'
        }
    ];

    addFee() {
        this.tournament.fees = [...(this.tournament.fees ?? []), { code: '', name: '', amount: 0, mandatory: true }];
    }

    removeFee(index: number) {
        this.tournament.fees = (this.tournament.fees ?? []).filter((_, i) => i !== index);
    }

    /** Fills the visible name from the catalog the first time a code is picked. */
    nameFee(fee: TournamentFeeRequest) {
        if (!fee.name?.trim() && fee.code) {
            fee.name = this.catalogService.label('fee_codes', fee.code);
        }
    }

    /** Tells the organizer what authorising this rule will cost, if anything. */
    feeHint(rule: EligibilityRuleKey): string {
        const code = rule.replace('policy_', '');
        const fee = (this.tournament.fees ?? []).find((f) => f.code === code);
        if (!fee || !fee.amount) {
            return 'Sin cargo. Agrega una línea al tarifario con este código para cobrarlo.';
        }
        return `Se cobrará ${fee.amount.toFixed(2)} ${this.tournament.currency ?? ''} al autorizarlo.`;
    }

    private load(id: number) {
        this.tournamentService.getTournament(id).subscribe({
            next: (res) => {
                const data = res.data as TournamentResponse;
                this.tournament = {
                    ...data,
                    currency: data.currency ?? 'GTQ',
                    fees: (data.fees ?? []).map((fee) => ({
                        code: fee.code,
                        name: fee.name,
                        amount: fee.amount,
                        mandatory: fee.mandatory
                    }))
                };
                this.startDate = data.start_date ? new Date(data.start_date) : undefined;
                this.endDate = data.end_date ? new Date(data.end_date) : undefined;
                this.paymentDeadline = data.payment_deadline ? new Date(data.payment_deadline) : null;
                this.tiebreakerList = (data.tiebreakers || '').split(',').filter(Boolean);
                this.knockoutTiebreakList = (data.knockout_tiebreaks || '').split(',').filter(Boolean);
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
            knockout_tiebreaks: this.knockoutTiebreakList.join(','),
            scheduling_day: Number(this.schedulingDay),
            // A line with no code could never be charged, since the code is what a
            // waiver and a payment look themselves up by.
            fees: (this.tournament.fees ?? []).filter((fee) => fee.code?.trim())
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
