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
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService, ConfirmationService } from 'primeng/api';
import { MatchService, Match } from '../service/match.service';
import { TournamentService, Tournament } from '../service/tournament.service';
import { TeamService, Team } from '../service/team.service';
import { FieldService, Field } from '../service/field.service';
import { CatalogService } from '../service/catalog.service';

@Component({
    selector: 'app-matches',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, DialogModule, ToastModule, ToolbarModule, ConfirmDialogModule, SelectModule, DatePickerModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './matches.html',
    styleUrl: './matches.css'
})
export class Matches implements OnInit {
    matches: Match[] = [];
    match: Match = { tournament_id: 0, field_id: 0, local_team_id: 0, visitor_team_id: 0, match_date: '' };
    matchDialog: boolean = false;
    loading: boolean = true;
    matchDate: Date = new Date();

    tournaments: Tournament[] = [];
    fields: Field[] = [];
    teams: Team[] = [];

    constructor(
        private matchService: MatchService,
        private tournamentService: TournamentService,
        private teamService: TeamService,
        private fieldService: FieldService,
        private catalogService: CatalogService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) { }

    ngOnInit() {
        this.loadInitialData();
        this.loadMatches();
    }

    loadInitialData() {
        this.tournamentService.getTournaments().subscribe(res => this.tournaments = res.data || []);
        this.teamService.getTeams().subscribe(res => this.teams = res.data || []);
        this.fieldService.getFields().subscribe(res => this.fields = res.data || []);
    }

    loadMatches() {
        this.loading = true;
        this.matchService.getMatches().subscribe({
            next: (res) => {
                this.matches = res.data || [];
                this.loading = false;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los partidos' });
                this.loading = false;
            }
        });
    }

    getTournamentName(id: number) { return this.tournaments.find(t => t.id === id)?.name || id; }
    getTeamName(id: number) { return this.teams.find(t => t.id === id)?.name || id; }
    getFieldName(id: number) { return this.fields.find(f => f.id === id)?.name || id; }

    getStatusName(id: string) {
        return this.catalogService.getCatalog('match_statuses').find(s => s.id === id)?.name || id;
    }

    statuses() {
        return this.catalogService.getCatalog('match_statuses');
    }

    openNew() {
        this.match = { tournament_id: 0, field_id: 0, local_team_id: 0, visitor_team_id: 0, match_date: '' };
        this.matchDate = new Date();
        this.matchDialog = true;
    }

    editMatch(match: Match) {
        this.match = { ...match };
        this.matchDate = new Date(match.match_date);
        this.matchDialog = true;
    }

    deleteMatch(match: Match) {
        this.confirmationService.confirm({
            message: '¿Está seguro de que desea eliminar este partido?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.matchService.deleteMatch(match.id!).subscribe(() => {
                    this.messageService.add({ severity: 'success', summary: 'Partido eliminado', detail: '' });
                    this.loadMatches();
                });
            }
        });
    }

    hideDialog() {
        this.matchDialog = false;
    }

    saveMatch() {
        this.match.match_date = this.matchDate.toISOString();
        if (this.match.tournament_id && this.match.local_team_id && this.match.visitor_team_id) {
            if (this.match.id) {
                this.matchService.updateMatch(this.match.id, this.match).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Partido actualizado', detail: '' });
                        this.loadMatches();
                        this.matchDialog = false;
                    }
                });
            } else {
                this.matchService.createMatch(this.match).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Partido creado', detail: '' });
                        this.loadMatches();
                        this.matchDialog = false;
                    }
                });
            }
        } else {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Complete los campos obligatorios' });
        }
    }
}
