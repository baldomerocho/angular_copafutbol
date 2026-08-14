import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBase } from './api.base';
import { BaseResponse } from './interfaces/base.interface';
import {
    AutoAssignGroupsRequest,
    TournamentGroupRequest,
    TournamentGroupResponse,
    TournamentRequest,
    TournamentResponse
} from './interfaces/tournament.interface';
import { MatchResponse } from './interfaces/match.interface';

export interface TournamentFilters {
    status?: string;
    type?: string;
    season?: string;
}

@Injectable({ providedIn: 'root' })
export class TournamentService extends ApiBase {
    getTournaments(filters?: TournamentFilters): Observable<BaseResponse<TournamentResponse[]>> {
        return this.http.get<BaseResponse<TournamentResponse[]>>(this.pub('/tournaments'), {
            params: this.params(filters)
        });
    }

    getTournament(id: number): Observable<BaseResponse<TournamentResponse>> {
        return this.http.get<BaseResponse<TournamentResponse>>(this.pub(`/tournaments/${id}`));
    }

    createTournament(tournament: TournamentRequest): Observable<BaseResponse<TournamentResponse>> {
        return this.http.post<BaseResponse<TournamentResponse>>(this.scoped('/tournaments'), tournament);
    }

    updateTournament(id: number, tournament: TournamentRequest): Observable<BaseResponse<TournamentResponse>> {
        return this.http.put<BaseResponse<TournamentResponse>>(this.scoped(`/tournaments/${id}`), tournament);
    }

    /** Deleting a tournament is admin-only; the prefix is fixed on purpose. */
    deleteTournament(id: number): Observable<BaseResponse<TournamentResponse>> {
        return this.http.delete<BaseResponse<TournamentResponse>>(`${this.baseUrl}/admin/tournaments/${id}`);
    }

    // --- Groups ---

    getGroups(tournamentId: number): Observable<BaseResponse<TournamentGroupResponse[]>> {
        return this.http.get<BaseResponse<TournamentGroupResponse[]>>(this.pub(`/tournaments/${tournamentId}/groups`));
    }

    createGroup(tournamentId: number, group: TournamentGroupRequest): Observable<BaseResponse<TournamentGroupResponse>> {
        return this.http.post<BaseResponse<TournamentGroupResponse>>(this.scoped(`/tournaments/${tournamentId}/groups`), group);
    }

    updateGroup(tournamentId: number, groupId: number, group: TournamentGroupRequest): Observable<BaseResponse<TournamentGroupResponse>> {
        return this.http.put<BaseResponse<TournamentGroupResponse>>(this.scoped(`/tournaments/${tournamentId}/groups/${groupId}`), group);
    }

    deleteGroup(tournamentId: number, groupId: number): Observable<BaseResponse<TournamentGroupResponse>> {
        return this.http.delete<BaseResponse<TournamentGroupResponse>>(this.scoped(`/tournaments/${tournamentId}/groups/${groupId}`));
    }

    setGroupTeams(tournamentId: number, groupId: number, teamIds: number[]): Observable<BaseResponse<TournamentGroupResponse>> {
        return this.http.put<BaseResponse<TournamentGroupResponse>>(
            this.scoped(`/tournaments/${tournamentId}/groups/${groupId}/teams`),
            { team_ids: teamIds }
        );
    }

    autoAssignGroups(tournamentId: number, config: AutoAssignGroupsRequest): Observable<BaseResponse<TournamentGroupResponse[]>> {
        return this.http.post<BaseResponse<TournamentGroupResponse[]>>(
            this.scoped(`/tournaments/${tournamentId}/groups/auto`),
            config
        );
    }

    // --- Calendar ---

    generateFixtures(tournamentId: number): Observable<BaseResponse<MatchResponse[]>> {
        return this.http.post<BaseResponse<MatchResponse[]>>(this.scoped(`/tournaments/${tournamentId}/generate-fixtures`), {});
    }

    generateKnockout(tournamentId: number): Observable<BaseResponse<MatchResponse[]>> {
        return this.http.post<BaseResponse<MatchResponse[]>>(this.scoped(`/tournaments/${tournamentId}/generate-knockout`), {});
    }

    clearFixtures(tournamentId: number, stage?: string): Observable<BaseResponse<string>> {
        return this.http.delete<BaseResponse<string>>(this.scoped(`/tournaments/${tournamentId}/fixtures`), {
            params: this.params({ stage })
        });
    }
}
