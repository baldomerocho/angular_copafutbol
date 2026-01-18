import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { BaseResponse } from './interfaces/base.interface';
import { MatchResponse, MatchRequest, MatchUpdateRequest, MatchEventRequest, LineupRequest } from './interfaces/match.interface';

@Injectable({
    providedIn: 'root'
})
export class MatchService {
    private baseUrl = environment.apiUrl;

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    getMatches(filters?: { tournament_id?: number, team_id?: number }): Observable<BaseResponse<MatchResponse[]>> {
        return this.http.get(`${this.baseUrl}/public/matches`, { params: filters as any }) as Observable<BaseResponse<MatchResponse[]>>;
    }

    getMatch(id: number): Observable<BaseResponse<MatchResponse>> {
        return this.http.get(`${this.baseUrl}/public/matches/${id}`) as Observable<BaseResponse<MatchResponse>>;
    }

    createMatch(match: MatchRequest): Observable<BaseResponse<MatchResponse>> {
        const prefix = this.authService.getRolePrefix();
        return this.http.post(`${this.baseUrl}/${prefix}/matches`, match) as Observable<BaseResponse<MatchResponse>>;
    }

    updateMatch(id: number, match: MatchUpdateRequest): Observable<BaseResponse<MatchResponse>> {
        const prefix = this.authService.getRolePrefix();
        return this.http.patch(`${this.baseUrl}/${prefix}/matches/${id}`, match) as Observable<BaseResponse<MatchResponse>>;
    }

    deleteMatch(id: number): Observable<BaseResponse<any>> {
        const prefix = this.authService.getRolePrefix();
        return this.http.delete(`${this.baseUrl}/${prefix}/matches/${id}`) as Observable<BaseResponse<any>>;
    }

    addEvent(matchId: number, event: MatchEventRequest): Observable<BaseResponse<any>> {
        const prefix = this.authService.getRolePrefix();
        return this.http.post(`${this.baseUrl}/${prefix}/matches/${matchId}/events`, event) as Observable<BaseResponse<any>>;
    }

    setLineup(matchId: number, teamId: number, lineup: LineupRequest): Observable<BaseResponse<any>> {
        const prefix = this.authService.getRolePrefix();
        return this.http.post(`${this.baseUrl}/${prefix}/matches/${matchId}/teams/${teamId}/lineup`, lineup) as Observable<BaseResponse<any>>;
    }
}
