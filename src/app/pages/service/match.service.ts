import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Match {
    id?: number;
    tournament_id: number;
    field_id: number;
    local_team_id: number;
    visitor_team_id: number;
    match_date: string;
    local_score?: number;
    visitor_score?: number;
    status?: string;
}

@Injectable({
    providedIn: 'root'
})
export class MatchService {
    private baseUrl = 'https://app-dev-clubfutbol.server.gt';

    constructor(private http: HttpClient) { }

    getMatches(): Observable<any> {
        // Mocking list via public matches if available, otherwise consider tournament matches
        return this.http.get(`${this.baseUrl}/public/matches`);
    }

    getMatch(id: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/public/matches/${id}`);
    }

    createMatch(match: Match): Observable<any> {
        return this.http.post(`${this.baseUrl}/admin/matches`, match);
    }

    updateMatch(id: number, match: any): Observable<any> {
        return this.http.patch(`${this.baseUrl}/staff/matches/${id}`, match);
    }

    deleteMatch(id: number): Observable<any> {
        return this.http.delete(`${this.baseUrl}/admin/matches/${id}`);
    }

    addEvent(matchId: number, event: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/staff/matches/${matchId}/events`, event);
    }

    setLineup(matchId: number, teamId: number, lineup: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/manager/matches/${matchId}/teams/${teamId}/lineup`, lineup);
    }
}
