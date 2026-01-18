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
import { TeamService } from '../service/team.service';
import { Team } from '../service/interfaces/team.interface';

@Component({
    selector: 'app-teams',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, DialogModule, ToastModule, ToolbarModule, ConfirmDialogModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './teams.html',
    styleUrl: './teams.css'
})
export class Teams implements OnInit {
    teams: Team[] = [];
    team: Team = { name: '' };
    teamDialog: boolean = false;
    loading: boolean = true;

    constructor(
        private teamService: TeamService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) { }

    ngOnInit() {
        this.loadTeams();
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

    editTeam(team: Team) {
        this.team = { ...team };
        this.teamDialog = true;
    }

    deleteTeam(team: Team) {
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
                this.teamService.updateTeam(this.team.id, this.team).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Equipo actualizado', detail: '' });
                        this.loadTeams();
                        this.teamDialog = false;
                    }
                });
            } else {
                this.teamService.createTeam(this.team).subscribe({
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
