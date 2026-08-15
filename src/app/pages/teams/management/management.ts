import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { FluidModule } from 'primeng/fluid';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../service/auth.service';
import { CatalogService } from '../../service/catalog.service';
import { ClubService } from '../../service/club.service';
import { ClubResponse } from '../../service/interfaces/team.interface';
import { SimpleRelation } from '../../service/interfaces/catalog.interface';
import { TeamRequest } from '../../service/interfaces/team.interface';
import { TournamentResponse } from '../../service/interfaces/tournament.interface';
import { UserResponse } from '../../service/interfaces/user.interface';
import { TeamService } from '../../service/team.service';
import { TournamentService } from '../../service/tournament.service';
import { UserService } from '../../service/user.service';

@Component({
    selector: 'app-team-management',
    standalone: true,
    imports: [
        CommonModule, FormsModule, RouterModule, ButtonModule, InputTextModule,
        SelectModule, ToastModule, FluidModule, MessageModule
    ],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="card">
            <div class="flex flex-wrap justify-between items-start gap-4 mb-6">
                <div>
                    <h1 class="text-xl font-semibold m-0">{{ isEdit ? 'Editar equipo' : 'Nuevo equipo' }}</h1>
                    <p class="text-muted-color text-sm mt-1 mb-0">
                        {{ isManager() ? 'El equipo queda a tu nombre.' : 'Asigna el delegado responsable y el torneo.' }}
                    </p>
                </div>
                <div class="flex gap-2">
                    <p-button label="Cancelar" severity="secondary" [text]="true" routerLink="/pages/teams" />
                    <p-button label="Guardar" icon="pi pi-check" [loading]="saving()" (onClick)="save()" />
                </div>
            </div>

            <p-fluid>
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                        <label class="font-medium">Nombre del equipo <span class="text-red-500">*</span></label>
                        <input pInputText [(ngModel)]="team.name" placeholder="Deportivo Central" />
                    </div>

                    <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                        <label class="font-medium">Club</label>
                        <p-select [options]="clubs()" [(ngModel)]="team.club_id" optionLabel="name" optionValue="id"
                                  placeholder="Independiente" appendTo="body" [showClear]="true"
                                  [filter]="true" filterBy="name" [loading]="loadingExtra()" />
                        <small class="text-muted-color">
                            Un club puede tener varios equipos, uno por división.
                            <a routerLink="/pages/clubs" class="underline">Gestionar clubes</a>.
                        </small>
                    </div>

                    <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                        <label class="font-medium">División</label>
                        <p-select [options]="divisions()" [(ngModel)]="team.division" optionLabel="name" optionValue="id"
                                  placeholder="Sin división" appendTo="body" [showClear]="true" [editable]="true" />
                        <small class="text-muted-color">Primera, reserva, sub-17… lo que use tu liga.</small>
                    </div>

                    @if (!isManager()) {
                        <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                            <label class="font-medium">Delegado <span class="text-red-500">*</span></label>
                            <p-select [options]="managers()" [(ngModel)]="team.manager_id" optionLabel="name"
                                      optionValue="id" placeholder="Selecciona un delegado" appendTo="body"
                                      [filter]="true" filterBy="name,email" [loading]="loadingExtra()" />
                        </div>

                        <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                            <label class="font-medium">Torneo</label>
                            <p-select [options]="tournaments()" [(ngModel)]="team.tournament_id" optionLabel="name"
                                      optionValue="id" placeholder="Sin inscribir" appendTo="body" [showClear]="true" />
                            <small class="text-muted-color">Asignar el torneo aquí salta la validación de pagos.</small>
                        </div>
                    } @else if (isEdit && team.tournament_id) {
                        <div class="col-span-12">
                            <p-message severity="secondary" icon="pi pi-info-circle" styleClass="w-full">
                                El equipo ya está inscrito en un torneo. Para cambiarlo, contacta al staff.
                            </p-message>
                        </div>
                    }
                </div>
            </p-fluid>
        </div>
    `
})
export class TeamManagement implements OnInit {
    private readonly teamService = inject(TeamService);
    private readonly clubService = inject(ClubService);
    private readonly catalogService = inject(CatalogService);
    private readonly tournamentService = inject(TournamentService);
    private readonly userService = inject(UserService);
    private readonly authService = inject(AuthService);
    private readonly messageService = inject(MessageService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    team: TeamRequest & { id?: number } = { name: '', division: '', club_id: undefined, tournament_id: undefined, manager_id: undefined };
    isEdit = false;

    readonly tournaments = signal<TournamentResponse[]>([]);
    readonly managers = signal<UserResponse[]>([]);
    readonly clubs = signal<ClubResponse[]>([]);
    readonly saving = signal(false);
    readonly loadingExtra = signal(false);

    ngOnInit() {
        const id = this.route.snapshot.params['id'];
        if (id) {
            this.isEdit = true;
            this.load(Number(id));
        }

        // Managers still pick a club — they own theirs. Only staff and admin pick the
        // owner and the tournament.
        this.loadClubs();
        if (!this.isManager()) {
            this.loadPickers();
        }
    }

    isManager(): boolean {
        return this.authService.isManager();
    }

    /** The Spanish division labels come from the catalog, but the field stays free text. */
    divisions(): SimpleRelation[] {
        return this.catalogService.get('team_divisions');
    }

    private loadClubs() {
        this.clubService
            .getClubs()
            .pipe(catchError(() => of({ data: [] })))
            .subscribe((res) => this.clubs.set((res.data ?? []) as ClubResponse[]));
    }

    private loadPickers() {
        this.loadingExtra.set(true);
        forkJoin({
            tournaments: this.tournamentService.getTournaments().pipe(catchError(() => of({ data: [] }))),
            managers: this.userService.getUsers({ role: 'manager' }).pipe(catchError(() => of({ data: [] })))
        }).subscribe(({ tournaments, managers }) => {
            this.tournaments.set((tournaments.data ?? []) as TournamentResponse[]);
            this.managers.set((managers.data ?? []) as UserResponse[]);
            this.loadingExtra.set(false);
        });
    }

    private load(id: number) {
        this.teamService.getTeam(id).subscribe({
            next: (res) => {
                const data = res.data;
                if (!data) return;
                this.team = {
                    id: data.id,
                    name: data.name,
                    division: data.division ?? '',
                    club_id: data.club_id,
                    manager_id: data.manager_id,
                    tournament_id: data.tournament_id
                };
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el equipo.' })
        });
    }

    save() {
        if (!this.team.name?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Falta el nombre', detail: 'El equipo necesita un nombre.' });
            return;
        }
        if (!this.isManager() && !this.team.manager_id) {
            this.messageService.add({ severity: 'warn', summary: 'Falta el delegado', detail: 'Selecciona quién gestiona el equipo.' });
            return;
        }

        this.saving.set(true);
        const payload: TeamRequest = {
            name: this.team.name.trim(),
            division: this.team.division?.trim() || undefined,
            club_id: this.team.club_id ?? null,
            manager_id: this.team.manager_id,
            tournament_id: this.team.tournament_id ?? null
        };

        const request = this.isEdit
            ? this.teamService.updateTeam(this.team.id!, payload)
            : this.teamService.createTeam(payload);

        request.subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Guardado',
                    detail: `Equipo ${this.isEdit ? 'actualizado' : 'creado'} correctamente.`
                });
                setTimeout(() => this.router.navigate(['/pages/teams']), 900);
            },
            error: (err) => {
                this.saving.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'No se pudo guardar',
                    detail: err.error?.message ?? 'Inténtalo de nuevo.'
                });
            }
        });
    }
}
