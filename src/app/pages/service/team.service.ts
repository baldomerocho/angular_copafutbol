import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { BaseResponse } from './interfaces/base.interface';
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

    getTeams(): Observable<BaseResponse<Team[]>> {
        const prefix = this.authService.getRolePrefix();
        return this.http.get(`${this.baseUrl}/${prefix}/teams`) as Observable<BaseResponse<Team[]>>;
    }

    getTeam(id: number): Observable<BaseResponse<Team>> {
        const prefix = this.authService.getRolePrefix();
        return this.http.get(`${this.baseUrl}/${prefix}/teams/${id}`) as Observable<BaseResponse<Team>>;
    }

    createTeam(team: Team): Observable<BaseResponse<Team>> {
        const prefix = this.authService.getRolePrefix();
        return this.http.post(`${this.baseUrl}/${prefix}/teams`, team) as Observable<BaseResponse<Team>>;
    }

    updateTeam(id: number, team: Team): Observable<BaseResponse<Team>> {
        const prefix = this.authService.getRolePrefix();
        return this.http.put(`${this.baseUrl}/${prefix}/teams/${id}`, team) as Observable<BaseResponse<Team>>;
    }

    deleteTeam(id: number): Observable<BaseResponse<any>> {
        const prefix = this.authService.getRolePrefix();
        return this.http.delete(`${this.baseUrl}/${prefix}/teams/${id}`) as Observable<BaseResponse<any>>;
    }

    getPlayers(teamId: number): Observable<BaseResponse<any>> {
        return this.http.get(`${this.baseUrl}/public/teams/${teamId}/players`) as Observable<BaseResponse<any>>;
    }

    addPlayer(teamId: number, player: any): Observable<BaseResponse<any>> {
        const prefix = this.authService.getRolePrefix();
        return this.http.post(`${this.baseUrl}/${prefix}/teams/${teamId}/players`, player) as Observable<BaseResponse<any>>;
    }
}
