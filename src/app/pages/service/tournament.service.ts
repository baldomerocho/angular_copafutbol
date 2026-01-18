import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { BaseResponse } from './interfaces/base.interface';
import { Tournament } from './interfaces/tournament.interface';

@Injectable({
    providedIn: 'root'
})
export class TournamentService {
    private baseUrl = environment.apiUrl;

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    getTournaments(): Observable<BaseResponse<Tournament[]>> {
        return this.http.get(`${this.baseUrl}/public/tournaments`) as Observable<BaseResponse<Tournament[]>>;
    }

    getTournament(id: number): Observable<BaseResponse<Tournament>> {
        return this.http.get(`${this.baseUrl}/public/tournaments/${id}`) as Observable<BaseResponse<Tournament>>;
    }

    createTournament(tournament: Tournament): Observable<BaseResponse<Tournament>> {
        const prefix = this.authService.getRolePrefix();
        return this.http.post(`${this.baseUrl}/${prefix}/tournaments`, tournament) as Observable<BaseResponse<Tournament>>;
    }

    updateTournament(id: number, tournament: Tournament): Observable<BaseResponse<Tournament>> {
        const prefix = this.authService.getRolePrefix();
        return this.http.put(`${this.baseUrl}/${prefix}/tournaments/${id}`, tournament) as Observable<BaseResponse<Tournament>>;
    }

    deleteTournament(id: number): Observable<BaseResponse<any>> {
        const prefix = this.authService.getRolePrefix();
        return this.http.delete(`${this.baseUrl}/${prefix}/tournaments/${id}`) as Observable<BaseResponse<any>>;
    }
}
