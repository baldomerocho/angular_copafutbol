import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBase } from './api.base';
import { BaseResponse } from './interfaces/base.interface';
import { MonitoringTeamStatus, PlayerRequest, PlayerResponse, TeamRequest, TeamResponse } from './interfaces/team.interface';

export interface TeamFilters {
    tournament_id?: number;
    unassigned?: boolean;
}

@Injectable({ providedIn: 'root' })
export class TeamService extends ApiBase {
    /** Managers get only their own teams; staff and admin get all of them. */
    getTeams(filters?: TeamFilters): Observable<BaseResponse<TeamResponse[]>> {
        return this.http.get<BaseResponse<TeamResponse[]>>(this.scoped('/teams'), {
            params: this.params(filters)
        });
    }

    getTeam(id: number): Observable<BaseResponse<TeamResponse>> {
        return this.http.get<BaseResponse<TeamResponse>>(this.scoped(`/teams/${id}`));
    }

    createTeam(team: TeamRequest): Observable<BaseResponse<TeamResponse>> {
        return this.http.post<BaseResponse<TeamResponse>>(this.scoped('/teams'), team);
    }

    updateTeam(id: number, team: TeamRequest): Observable<BaseResponse<TeamResponse>> {
        return this.http.put<BaseResponse<TeamResponse>>(this.scoped(`/teams/${id}`), team);
    }

    deleteTeam(id: number): Observable<BaseResponse<TeamResponse>> {
        return this.http.delete<BaseResponse<TeamResponse>>(this.scoped(`/teams/${id}`));
    }

    enroll(teamId: number, tournamentId: number): Observable<BaseResponse<TeamResponse>> {
        return this.http.post<BaseResponse<TeamResponse>>(this.scoped(`/teams/${teamId}/enroll`), null, {
            params: this.params({ tournament_id: tournamentId })
        });
    }

    withdraw(teamId: number): Observable<BaseResponse<TeamResponse>> {
        return this.http.post<BaseResponse<TeamResponse>>(this.scoped(`/teams/${teamId}/withdraw`), {});
    }

    getMonitoring(filters?: { tournament_id?: number; missing_only?: boolean; fully_paid?: boolean }): Observable<BaseResponse<MonitoringTeamStatus[]>> {
        return this.http.get<BaseResponse<MonitoringTeamStatus[]>>(this.scoped('/teams/monitoring'), {
            params: this.params(filters)
        });
    }

    // --- Players ---

    getPlayers(teamId: number): Observable<BaseResponse<PlayerResponse[]>> {
        return this.http.get<BaseResponse<PlayerResponse[]>>(this.pub(`/teams/${teamId}/players`));
    }

    addPlayer(teamId: number, player: PlayerRequest): Observable<BaseResponse<PlayerResponse>> {
        return this.http.post<BaseResponse<PlayerResponse>>(this.scoped(`/teams/${teamId}/players`), player);
    }

    updatePlayer(teamId: number, playerId: number, player: PlayerRequest): Observable<BaseResponse<PlayerResponse>> {
        return this.http.put<BaseResponse<PlayerResponse>>(this.scoped(`/teams/${teamId}/players/${playerId}`), player);
    }

    deletePlayer(teamId: number, playerId: number): Observable<BaseResponse<PlayerResponse>> {
        return this.http.delete<BaseResponse<PlayerResponse>>(this.scoped(`/teams/${teamId}/players/${playerId}`));
    }

    // --- Public ---

    getPublicTeams(tournamentId: number): Observable<BaseResponse<TeamResponse[]>> {
        return this.http.get<BaseResponse<TeamResponse[]>>(this.pub(`/tournaments/${tournamentId}/teams`));
    }

    getPublicTeam(id: number): Observable<BaseResponse<TeamResponse>> {
        return this.http.get<BaseResponse<TeamResponse>>(this.pub(`/teams/${id}`));
    }
}
