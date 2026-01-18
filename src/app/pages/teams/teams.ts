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
import { TeamService } from '../service/team.service';
import { TeamResponse, TeamRequest, PlayerResponse } from '../service/interfaces/team.interface';
import { AuthService } from '../service/auth.service';
import { TournamentService } from '../service/tournament.service';
import { UserService } from '../service/user.service';
import { TournamentResponse } from '../service/interfaces/tournament.interface';
import { UserResponse } from '../service/interfaces/user.interface';
import { SelectModule } from 'primeng/select';

@Component({
    selector: 'app-teams',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, DialogModule, ToastModule, ToolbarModule, ConfirmDialogModule, FluidModule, SelectModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './teams.html',
    styleUrl: './teams.css'
})
export class Teams implements OnInit {
    teams: TeamResponse[] = [];
    team: any = { name: '' };
    teamDialog: boolean = false;
    loading: boolean = true;
    loadingExtra: boolean = false;

    prefix: string = '';
    tournaments: TournamentResponse[] = [];
    managers: UserResponse[] = [];
    players: PlayerResponse[] = [];

    constructor(
        private teamService: TeamService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private authService: AuthService,
        private tournamentService: TournamentService,
        private userService: UserService
    ) { }

    ngOnInit() {
        this.loadTeams();
        this.prefix = this.authService.getRolePrefix();
        if (this.prefix === 'admin' || this.prefix === 'staff') {
            this.loadExtraData();
        }
    }

    loadExtraData() {
        this.loadingExtra = true;
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

    private loadedCount = 0;
    private checkExtraLoading() {
        this.loadedCount++;
        if (this.loadedCount >= 2) {
            this.loadingExtra = false;
        }
    }

    loadTeams() {
        this.loading = true;
        this.teamService.getTeams().subscribe({
            next: (res) => {
                this.teams = res.data || [];
                this.loading = false;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los equipos' });
                this.loading = false;
            }
        });
    }

    openNew() {
        this.team = { name: '' };
        this.teamDialog = true;
    }

    editTeam(team: TeamResponse) {
        this.team = { ...team };
        this.teamDialog = true;
    }

    deleteTeam(team: TeamResponse) {
        this.confirmationService.confirm({
            message: '¿Está seguro de que desea eliminar ' + team.name + '?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.teamService.deleteTeam(team.id!).subscribe(() => {
                    this.messageService.add({ severity: 'success', summary: 'Equipo eliminado', detail: '' });
                    this.loadTeams();
                });
            }
        });
    }

    hideDialog() {
        this.teamDialog = false;
    }

    saveTeam() {
        if (this.team.name.trim()) {
            if (this.team.id) {
                const request: TeamRequest = {
                    name: this.team.name,
                    tournament_id: this.team.tournament_id,
                    manager_id: this.team.manager_id
                };
                this.teamService.updateTeam(this.team.id, request).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Equipo actualizado', detail: '' });
                        this.loadTeams();
                        this.teamDialog = false;
                    }
                });
            } else {
                const request: TeamRequest = {
                    name: this.team.name,
                    tournament_id: this.team.tournament_id,
                    manager_id: this.team.manager_id
                };
                this.teamService.createTeam(request).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Equipo creado', detail: '' });
                        this.loadTeams();
                        this.teamDialog = false;
                    }
                });
            }
        }
    }
}
