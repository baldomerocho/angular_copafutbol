import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBase } from './api.base';
import { BaseResponse } from './interfaces/base.interface';
import {
    MonitoringTeamStatus,
    RosterEntryRequest,
    RosterEntryResponse,
    TeamRequest,
    TeamResponse
} from './interfaces/team.interface';
import { Paging } from './interfaces/base.interface';

export interface TeamFilters extends Paging {
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

    // --- Roster ---
    //
    // A roster entry is the pairing of a person with a shirt for this squad. The
    // person exists independently, which is why removing them from a squad does
    // not delete them.

    getRoster(teamId: number): Observable<BaseResponse<RosterEntryResponse[]>> {
        return this.http.get<BaseResponse<RosterEntryResponse[]>>(this.pub(`/teams/${teamId}/players`));
    }

    registerPlayer(teamId: number, entry: RosterEntryRequest): Observable<BaseResponse<RosterEntryResponse>> {
        return this.http.post<BaseResponse<RosterEntryResponse>>(this.scoped(`/teams/${teamId}/players`), entry);
    }

    updateRosterEntry(teamId: number, playerId: number, entry: RosterEntryRequest): Observable<BaseResponse<RosterEntryResponse>> {
        return this.http.put<BaseResponse<RosterEntryResponse>>(this.scoped(`/teams/${teamId}/players/${playerId}`), entry);
    }

    removePlayer(teamId: number, playerId: number): Observable<BaseResponse<string>> {
        return this.http.delete<BaseResponse<string>>(this.scoped(`/teams/${teamId}/players/${playerId}`));
    }

    // --- Public ---

    getPublicTeams(tournamentId: number): Observable<BaseResponse<TeamResponse[]>> {
        return this.http.get<BaseResponse<TeamResponse[]>>(this.pub(`/tournaments/${tournamentId}/teams`));
    }

    getPublicTeam(id: number): Observable<BaseResponse<TeamResponse>> {
        return this.http.get<BaseResponse<TeamResponse>>(this.pub(`/teams/${id}`));
    }
}
