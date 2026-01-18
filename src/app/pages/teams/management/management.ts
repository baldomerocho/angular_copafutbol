import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { FluidModule } from 'primeng/fluid';
import { MessageService } from 'primeng/api';
import { TeamService } from '../../service/team.service';
import { TournamentService } from '../../service/tournament.service';
import { UserService } from '../../service/user.service';
import { TournamentResponse } from '../../service/interfaces/tournament.interface';
import { UserResponse } from '../../service/interfaces/user.interface';
import { TeamRequest } from '../../service/interfaces/team.interface';
import { AuthService } from '../../service/auth.service';

@Component({
    selector: 'app-team-management',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        ToastModule,
        FluidModule
    ],
    providers: [MessageService],
    templateUrl: './management.html'
})
export class TeamManagement implements OnInit {
    team: any = {
        name: '',
        tournament_id: undefined,
        manager_id: undefined
    };

    isEdit: boolean = false;
    loading: boolean = false;
    loadingExtra: boolean = false;
    prefix: string = '';

    tournaments: TournamentResponse[] = [];
    managers: UserResponse[] = [];

    constructor(
        private teamService: TeamService,
        private tournamentService: TournamentService,
        private userService: UserService,
        private authService: AuthService,
        private messageService: MessageService,
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit() {
        this.prefix = this.authService.getRolePrefix();
        const id = this.route.snapshot.params['id'];

        if (id) {
            this.isEdit = true;
            this.loadTeam(id);
        }

        if (this.prefix === 'admin' || this.prefix === 'staff') {
            this.loadExtraData();
        }
    }

    loadTeam(id: number) {
        this.loading = true;
        this.teamService.getTeam(id).subscribe({
            next: (res) => {
                this.team = res.data;
                this.loading = false;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el equipo' });
                this.loading = false;
            }
        });
    }

    private loadedCount = 0;
    loadExtraData() {
        this.loadingExtra = true;
        this.loadedCount = 0;

        this.tournamentService.getTournaments().subscribe({
            next: (res) => {
                this.tournaments = res.data || [];
                this.checkExtraLoading();
            },
            error: () => this.checkExtraLoading()
        });

        this.userService.getUsers().subscribe({
            next: (res) => {
                this.managers = res.data || [];
                this.checkExtraLoading();
            },
            error: () => this.checkExtraLoading()
        });
    }

    private checkExtraLoading() {
        this.loadedCount++;
        if (this.loadedCount >= 2) {
            this.loadingExtra = false;
        }
    }

    saveTeam() {
        if (!this.team.name?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'El nombre es obligatorio' });
            return;
        }

        this.loading = true;

        const request: TeamRequest = {
            name: this.team.name,
            tournament_id: this.team.tournament_id,
            manager_id: this.team.manager_id
        };

        const observable = this.isEdit
            ? this.teamService.updateTeam(this.team.id!, request)
            : this.teamService.createTeam(request);

        observable.subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Equipo ${this.isEdit ? 'actualizado' : 'creado'} correctamente` });
                setTimeout(() => this.router.navigate(['/pages/teams']), 1500);
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Ocurrió un error al guardar' });
                this.loading = false;
            }
        });
    }
}
