import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBase } from './api.base';
import { BaseResponse, Paging } from './interfaces/base.interface';
import {
    BracketRound,
    LineupBulkRequest,
    LineupResponse,
    MatchDetailsResponse,
    MatchEventRequest,
    MatchEventResponse,
    MatchRequest,
    MatchResponse,
    MatchUpdateRequest,
    PlayerStatsResponse,
    StandingsResponse,
    SuspensionResponse,
    SuspensionUpdateRequest
} from './interfaces/match.interface';

export interface MatchFilters extends Paging {
    tournament_id?: number;
    team_id?: number;
    group_id?: number;
    stage?: string;
    status?: string;
    limit?: number;
}

@Injectable({ providedIn: 'root' })
export class MatchService extends ApiBase {
    getMatches(filters?: MatchFilters): Observable<BaseResponse<MatchResponse[]>> {
        return this.http.get<BaseResponse<MatchResponse[]>>(this.pub('/matches'), {
            params: this.params(filters)
        });
    }

    getMatch(id: number): Observable<BaseResponse<MatchDetailsResponse>> {
        return this.http.get<BaseResponse<MatchDetailsResponse>>(this.pub(`/matches/${id}`));
    }

    createMatch(match: MatchRequest): Observable<BaseResponse<MatchResponse>> {
        return this.http.post<BaseResponse<MatchResponse>>(this.scoped('/matches'), match);
    }

    updateMatch(id: number, match: MatchUpdateRequest): Observable<BaseResponse<MatchResponse>> {
        return this.http.patch<BaseResponse<MatchResponse>>(this.scoped(`/matches/${id}`), match);
    }

    deleteMatch(id: number): Observable<BaseResponse<MatchResponse>> {
        return this.http.delete<BaseResponse<MatchResponse>>(this.scoped(`/matches/${id}`));
    }

    // --- Events ---

    getEvents(matchId: number): Observable<BaseResponse<MatchEventResponse[]>> {
        return this.http.get<BaseResponse<MatchEventResponse[]>>(this.scoped(`/matches/${matchId}/events`));
    }

    addEvent(matchId: number, event: MatchEventRequest): Observable<BaseResponse<MatchEventResponse>> {
        return this.http.post<BaseResponse<MatchEventResponse>>(this.scoped(`/matches/${matchId}/events`), event);
    }

    deleteEvent(matchId: number, eventId: number): Observable<BaseResponse<MatchEventResponse>> {
        return this.http.delete<BaseResponse<MatchEventResponse>>(this.scoped(`/matches/${matchId}/events/${eventId}`));
    }

    // --- Lineups ---

    getLineup(matchId: number, teamId: number): Observable<BaseResponse<LineupResponse[]>> {
        return this.http.get<BaseResponse<LineupResponse[]>>(this.scoped(`/matches/${matchId}/teams/${teamId}/lineup`));
    }

    setLineup(matchId: number, teamId: number, lineup: LineupBulkRequest): Observable<BaseResponse<LineupResponse[]>> {
        return this.http.put<BaseResponse<LineupResponse[]>>(this.scoped(`/matches/${matchId}/teams/${teamId}/lineup`), lineup);
    }

    removeFromLineup(matchId: number, teamId: number, playerId: number): Observable<BaseResponse<string>> {
        return this.http.delete<BaseResponse<string>>(this.scoped(`/matches/${matchId}/teams/${teamId}/lineup/${playerId}`));
    }

    // --- Read-only competition data ---

    getStandings(tournamentId: number): Observable<BaseResponse<StandingsResponse>> {
        return this.http.get<BaseResponse<StandingsResponse>>(this.pub(`/tournaments/${tournamentId}/standings`));
    }

    getBracket(tournamentId: number): Observable<BaseResponse<BracketRound[]>> {
        return this.http.get<BaseResponse<BracketRound[]>>(this.pub(`/tournaments/${tournamentId}/bracket`));
    }

    getPlayerStats(tournamentId: number, limit?: number): Observable<BaseResponse<PlayerStatsResponse[]>> {
        return this.http.get<BaseResponse<PlayerStatsResponse[]>>(this.pub(`/tournaments/${tournamentId}/player-stats`), {
            params: this.params({ limit })
        });
    }

    // --- Suspensions ---

    getSuspensions(filters?: { tournament_id?: number; team_id?: number; player_id?: number; active?: boolean }): Observable<BaseResponse<SuspensionResponse[]>> {
        return this.http.get<BaseResponse<SuspensionResponse[]>>(this.scoped('/suspensions'), {
            params: this.params(filters)
        });
    }

    getPublicSuspensions(tournamentId: number): Observable<BaseResponse<SuspensionResponse[]>> {
        return this.http.get<BaseResponse<SuspensionResponse[]>>(this.pub(`/tournaments/${tournamentId}/suspensions`));
    }

    updateSuspension(id: number, update: SuspensionUpdateRequest): Observable<BaseResponse<SuspensionResponse>> {
        return this.http.patch<BaseResponse<SuspensionResponse>>(this.scoped(`/suspensions/${id}`), update);
    }
}
