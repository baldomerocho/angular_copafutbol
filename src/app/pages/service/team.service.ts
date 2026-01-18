import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { BaseResponse } from './interfaces/base.interface';
import { TeamResponse, TeamRequest } from './interfaces/team.interface';

@Injectable({
    providedIn: 'root'
})
export class TeamService {
    private baseUrl = environment.apiUrl;

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    getTeams(): Observable<BaseResponse<TeamResponse[]>> {
        const prefix = this.authService.getRolePrefix();
        return this.http.get(`${this.baseUrl}/${prefix}/teams`) as Observable<BaseResponse<TeamResponse[]>>;
    }

    getTeam(id: number): Observable<BaseResponse<TeamResponse>> {
        const prefix = this.authService.getRolePrefix();
        return this.http.get(`${this.baseUrl}/${prefix}/teams/${id}`) as Observable<BaseResponse<TeamResponse>>;
    }

    createTeam(team: TeamRequest): Observable<BaseResponse<TeamResponse>> {
        const prefix = this.authService.getRolePrefix();
        return this.http.post(`${this.baseUrl}/${prefix}/teams`, team) as Observable<BaseResponse<TeamResponse>>;
    }

    updateTeam(id: number, team: TeamRequest): Observable<BaseResponse<TeamResponse>> {
        const prefix = this.authService.getRolePrefix();
        return this.http.put(`${this.baseUrl}/${prefix}/teams/${id}`, team) as Observable<BaseResponse<TeamResponse>>;
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

    updatePlayer(teamId: number, playerId: number, player: any): Observable<BaseResponse<any>> {
        const prefix = this.authService.getRolePrefix();
        return this.http.put(`${this.baseUrl}/${prefix}/teams/${teamId}/players/${playerId}`, player) as Observable<BaseResponse<any>>;
    }

    deletePlayer(teamId: number, playerId: number): Observable<BaseResponse<any>> {
        const prefix = this.authService.getRolePrefix();
        return this.http.delete(`${this.baseUrl}/${prefix}/teams/${teamId}/players/${playerId}`) as Observable<BaseResponse<any>>;
    }
}
