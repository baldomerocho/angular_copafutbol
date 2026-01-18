import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

import { Team } from './interfaces/team.interface';

@Injectable({
    providedIn: 'root'
})
export class TeamService {
    private baseUrl = environment.apiUrl;

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    getTeams(): Observable<any> {
        const prefix = this.authService.getRolePrefix();
        return this.http.get(`${this.baseUrl}/${prefix}/teams`);
    }

    getTeam(id: number): Observable<any> {
        const prefix = this.authService.getRolePrefix();
        return this.http.get(`${this.baseUrl}/${prefix}/teams/${id}`);
    }

    createTeam(team: Team): Observable<any> {
        const prefix = this.authService.getRolePrefix();
        return this.http.post(`${this.baseUrl}/${prefix}/teams`, team);
    }

    updateTeam(id: number, team: Team): Observable<any> {
        const prefix = this.authService.getRolePrefix();
        return this.http.put(`${this.baseUrl}/${prefix}/teams/${id}`, team);
    }

    deleteTeam(id: number): Observable<any> {
        const prefix = this.authService.getRolePrefix();
        return this.http.delete(`${this.baseUrl}/${prefix}/teams/${id}`);
    }

    getPlayers(teamId: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/public/teams/${teamId}/players`);
    }

    addPlayer(teamId: number, player: any): Observable<any> {
        const prefix = this.authService.getRolePrefix();
        return this.http.post(`${this.baseUrl}/${prefix}/teams/${teamId}/players`, player);
    }
}
