import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Team {
    id?: number;
    name: string;
    description?: string;
    logo_url?: string;
    manager_id?: number;
}

@Injectable({
    providedIn: 'root'
})
export class TeamService {
    private baseUrl = 'https://app-dev-clubfutbol.server.gt';

    constructor(private http: HttpClient) { }

    getTeams(): Observable<any> {
        return this.http.get(`${this.baseUrl}/manager/teams`);
    }

    getTeam(id: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/manager/teams/${id}`);
    }

    createTeam(team: Team): Observable<any> {
        return this.http.post(`${this.baseUrl}/manager/teams`, team);
    }

    updateTeam(id: number, team: Team): Observable<any> {
        return this.http.put(`${this.baseUrl}/manager/teams/${id}`, team);
    }

    deleteTeam(id: number): Observable<any> {
        return this.http.delete(`${this.baseUrl}/manager/teams/${id}`);
    }

    getPlayers(teamId: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/public/teams/${teamId}/players`);
    }

    addPlayer(teamId: number, player: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/manager/teams/${teamId}/players`, player);
    }
}
