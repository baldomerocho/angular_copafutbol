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
import { SelectModule } from 'primeng/select';
import { TournamentService } from '../service/tournament.service';
import { Tournament } from '../service/interfaces/tournament.interface';
import { CatalogService } from '../service/catalog.service';

@Component({
    selector: 'app-tournaments',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, DialogModule, ToastModule, ToolbarModule, ConfirmDialogModule, SelectModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './tournaments.html',
    styleUrl: './tournaments.css'
})
export class Tournaments implements OnInit {
    tournaments: Tournament[] = [];
    tournament: Tournament = { name: '' };
    tournamentDialog: boolean = false;
    loading: boolean = true;

    constructor(
        private tournamentService: TournamentService,
        private catalogService: CatalogService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) { }

    ngOnInit() {
        this.loadTournaments();
    }

    getStatusName(id: string) {
        return this.catalogService.getCatalog('tournament_statuses').find(s => s.id === id)?.name || id;
    }

    statuses() {
        return this.catalogService.getCatalog('tournament_statuses');
    }

    types() {
        return this.catalogService.getCatalog('tournament_types');
    }

    loadTournaments() {
        this.loading = true;
        this.tournamentService.getTournaments().subscribe({
            next: (res) => {
                this.tournaments = res.data || [];
                this.loading = false;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los torneos' });
                this.loading = false;
            }
        });
    }

    openNew() {
        this.tournament = { name: '' };
        this.tournamentDialog = true;
    }

    editTournament(tournament: Tournament) {
        this.tournament = { ...tournament };
        this.tournamentDialog = true;
    }

    deleteTournament(tournament: Tournament) {
        this.confirmationService.confirm({
            message: '¿Está seguro de que desea eliminar ' + tournament.name + '?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.tournamentService.deleteTournament(tournament.id!).subscribe(() => {
                    this.messageService.add({ severity: 'success', summary: 'Torneo eliminado', detail: '' });
                    this.loadTournaments();
                });
            }
        });
    }

    hideDialog() {
        this.tournamentDialog = false;
    }

    saveTournament() {
        if (this.tournament.name.trim()) {
            if (this.tournament.id) {
                this.tournamentService.updateTournament(this.tournament.id, this.tournament).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Torneo actualizado', detail: '' });
                        this.loadTournaments();
                        this.tournamentDialog = false;
                    }
                });
            } else {
                this.tournamentService.createTournament(this.tournament).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Torneo creado', detail: '' });
                        this.loadTournaments();
                        this.tournamentDialog = false;
                    }
                });
            }
        }
    }
}
