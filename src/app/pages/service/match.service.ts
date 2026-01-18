import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

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

    getMatches(filters?: { tournament_id?: number, team_id?: number }): Observable<any> {
        return this.http.get(`${this.baseUrl}/public/matches`, { params: filters as any });
    }

    getMatch(id: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/public/matches/${id}`);
    }

    createMatch(match: MatchRequest): Observable<any> {
        const prefix = this.authService.getRolePrefix();
        return this.http.post(`${this.baseUrl}/${prefix}/matches`, match);
    }

    updateMatch(id: number, match: MatchUpdateRequest): Observable<any> {
        const prefix = this.authService.getRolePrefix();
        return this.http.patch(`${this.baseUrl}/${prefix}/matches/${id}`, match);
    }

    deleteMatch(id: number): Observable<any> {
        const prefix = this.authService.getRolePrefix();
        return this.http.delete(`${this.baseUrl}/${prefix}/matches/${id}`);
    }

    addEvent(matchId: number, event: MatchEventRequest): Observable<any> {
        const prefix = this.authService.getRolePrefix();
        return this.http.post(`${this.baseUrl}/${prefix}/matches/${matchId}/events`, event);
    }

    setLineup(matchId: number, teamId: number, lineup: LineupRequest): Observable<any> {
        const prefix = this.authService.getRolePrefix();
        return this.http.post(`${this.baseUrl}/${prefix}/matches/${matchId}/teams/${teamId}/lineup`, lineup);
    }
}
