import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { FluidModule } from 'primeng/fluid';
import { TeamService } from '../service/team.service';
import { TeamResponse } from '../service/interfaces/team.interface';
import { AuthService } from '../service/auth.service';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-teams',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        ToastModule,
        ToolbarModule,
        ConfirmDialogModule,
        FluidModule,
        IconFieldModule,
        InputIconModule,
        TooltipModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './teams.html'
})
export class Teams implements OnInit {
    teams = signal<TeamResponse[]>([]);
    loading: boolean = true;
    prefix: string = '';

    constructor(
        private teamService: TeamService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private authService: AuthService
    ) { }

    ngOnInit() {
        this.prefix = this.authService.getRolePrefix();
        this.loadTeams();
    }

    loadTeams() {
        this.loading = true;
        this.teamService.getTeams().subscribe({
            next: (res) => {
                this.teams.set(res.data || []);
                this.loading = false;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los equipos' });
                this.loading = false;
            }
        });
    }

    deleteTeam(team: TeamResponse) {
        this.confirmationService.confirm({
            message: '¿Está seguro de que desea eliminar ' + team.name + '?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.teamService.deleteTeam(team.id!).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Equipo eliminado', detail: '' });
                        this.loadTeams();
                    },
                    error: (err) => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al eliminar equipo' });
                    }
                });
            }
        });
    }
}
