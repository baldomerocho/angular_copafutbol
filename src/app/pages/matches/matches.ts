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
import { MatchService } from '../service/match.service';
import { MatchResponse, MatchRequest, MatchUpdateRequest } from '../service/interfaces/match.interface';
import { TournamentService } from '../service/tournament.service';
import { Tournament } from '../service/interfaces/tournament.interface';
import { TeamService } from '../service/team.service';
import { Team } from '../service/interfaces/team.interface';
import { FieldService } from '../service/field.service';
import { Field } from '../service/interfaces/field.interface';
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
    matches: MatchResponse[] = [];
    match: any = {}; // Using any for the form model to handle both Request and Response
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
        this.match = { tournament_id: 0, field_id: 0, home_team_id: 0, away_team_id: 0, estimated_start_time: '', stage: 'group' };
        this.matchDate = new Date();
        this.matchDialog = true;
    }

    editMatch(match: MatchResponse) {
        this.match = { ...match };
        this.matchDate = new Date(match.estimated_start_time);
        this.matchDialog = true;
    }

    deleteMatch(match: MatchResponse) {
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
        const timeStr = this.matchDate.toISOString();
        if (this.match.tournament_id && this.match.home_team_id && this.match.away_team_id) {
            if (this.match.id) {
                const update: MatchUpdateRequest = {
                    home_score: this.match.home_score,
                    away_score: this.match.away_score,
                    status: this.match.status,
                    extra_minutes: this.match.extra_minutes
                };
                this.matchService.updateMatch(this.match.id, update).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Partido actualizado', detail: '' });
                        this.loadMatches();
                        this.matchDialog = false;
                    }
                });
            } else {
                const request: MatchRequest = {
                    tournament_id: this.match.tournament_id,
                    field_id: this.match.field_id,
                    home_team_id: this.match.home_team_id,
                    away_team_id: this.match.away_team_id,
                    estimated_start_time: timeStr,
                    stage: this.match.stage || 'group'
                };
                this.matchService.createMatch(request).subscribe({
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
