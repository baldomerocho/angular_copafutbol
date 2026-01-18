import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { BaseResponse } from './interfaces/base.interface';
import { TournamentResponse, TournamentRequest } from './interfaces/tournament.interface';

@Injectable({
    providedIn: 'root'
})
export class TournamentService {
    private baseUrl = environment.apiUrl;

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    getTournaments(): Observable<BaseResponse<TournamentResponse[]>> {
        return this.http.get(`${this.baseUrl}/public/tournaments`) as Observable<BaseResponse<TournamentResponse[]>>;
    }

    getTournament(id: number): Observable<BaseResponse<TournamentResponse>> {
        return this.http.get(`${this.baseUrl}/public/tournaments/${id}`) as Observable<BaseResponse<TournamentResponse>>;
    }

    createTournament(tournament: TournamentRequest): Observable<BaseResponse<TournamentResponse>> {
        const prefix = this.authService.getRolePrefix();
        return this.http.post(`${this.baseUrl}/${prefix}/tournaments`, tournament) as Observable<BaseResponse<TournamentResponse>>;
    }

    updateTournament(id: number, tournament: TournamentRequest): Observable<BaseResponse<TournamentResponse>> {
        const prefix = this.authService.getRolePrefix();
        return this.http.put(`${this.baseUrl}/${prefix}/tournaments/${id}`, tournament) as Observable<BaseResponse<TournamentResponse>>;
    }

    deleteTournament(id: number): Observable<BaseResponse<any>> {
        const prefix = this.authService.getRolePrefix();
        return this.http.delete(`${this.baseUrl}/${prefix}/tournaments/${id}`) as Observable<BaseResponse<any>>;
    }
}
