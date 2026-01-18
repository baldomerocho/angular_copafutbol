import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { FluidModule } from 'primeng/fluid';
import { TeamService } from '../../service/team.service';
import { TeamResponse, PlayerResponse } from '../../service/interfaces/team.interface';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

@Component({
    selector: 'app-players',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        InputNumberModule,
        DialogModule,
        ToastModule,
        ToolbarModule,
        ConfirmDialogModule,
        FluidModule,
        IconFieldModule,
        InputIconModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './players.html'
})
export class Players implements OnInit {
    teamId!: number;
    team?: TeamResponse;
    players = signal<PlayerResponse[]>([]);
    player: any = {};
    playerDialog: boolean = false;
    loading: boolean = true;
    submitted: boolean = false;

    @ViewChild('dt') dt!: Table;

    constructor(
        private teamService: TeamService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit() {
        this.teamId = Number(this.route.snapshot.params['id']);
        if (this.teamId) {
            this.loadTeam();
            this.loadPlayers();
        } else {
            this.router.navigate(['/pages/teams']);
        }
    }

    loadTeam() {
        this.teamService.getTeam(this.teamId).subscribe({
            next: (res) => (this.team = res.data)
        });
    }

    loadPlayers() {
        this.loading = true;
        this.teamService.getPlayers(this.teamId).subscribe({
            next: (res) => {
                this.players.set(res.data || []);
                this.loading = false;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los jugadores' });
                this.loading = false;
            }
        });
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.player = { name: '', number: undefined };
        this.submitted = false;
        this.playerDialog = true;
    }

    editPlayer(player: PlayerResponse) {
        this.player = { ...player };
        this.submitted = false;
        this.playerDialog = true;
    }

    deletePlayer(player: PlayerResponse) {
        this.confirmationService.confirm({
            message: `¿Está seguro de que desea eliminar a ${player.name}?`,
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.teamService.deletePlayer(this.teamId, player.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Jugador eliminado' });
                        this.loadPlayers();
                    },
                    error: (err) => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al eliminar jugador' });
                    }
                });
            }
        });
    }

    hideDialog() {
        this.playerDialog = false;
        this.submitted = false;
    }

    savePlayer() {
        this.submitted = true;

        if (this.player.name?.trim() && this.player.number !== undefined) {
            if (this.player.id) {
                this.teamService.updatePlayer(this.teamId, this.player.id, this.player).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Jugador actualizado' });
                        this.loadPlayers();
                        this.playerDialog = false;
                    },
                    error: (err) => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al actualizar jugador' });
                    }
                });
            } else {
                this.teamService.addPlayer(this.teamId, this.player).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Jugador añadido' });
                        this.loadPlayers();
                        this.playerDialog = false;
                    },
                    error: (err) => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al añadir jugador' });
                    }
                });
            }
        }
    }
}
