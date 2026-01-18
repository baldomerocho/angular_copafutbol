import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

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

    getTournaments(): Observable<any> {
        return this.http.get(`${this.baseUrl}/public/tournaments`);
    }

    getTournament(id: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/public/tournaments/${id}`);
    }

    createTournament(tournament: Tournament): Observable<any> {
        const prefix = this.authService.getRolePrefix();
        return this.http.post(`${this.baseUrl}/${prefix}/tournaments`, tournament);
    }

    updateTournament(id: number, tournament: Tournament): Observable<any> {
        const prefix = this.authService.getRolePrefix();
        return this.http.put(`${this.baseUrl}/${prefix}/tournaments/${id}`, tournament);
    }

    deleteTournament(id: number): Observable<any> {
        const prefix = this.authService.getRolePrefix();
        return this.http.delete(`${this.baseUrl}/${prefix}/tournaments/${id}`);
    }
}
