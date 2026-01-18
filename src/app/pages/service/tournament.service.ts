import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Tournament {
    id?: number;
    name: string;
    description?: string;
    location?: string;
    start_date?: string;
    end_date?: string;
    max_teams?: number;
    enrollment_price?: number;
    status?: string;
}

@Injectable({
    providedIn: 'root'
})
export class TournamentService {
    private baseUrl = 'https://app-dev-clubfutbol.server.gt';

    constructor(private http: HttpClient) { }

    getTournaments(): Observable<any> {
        return this.http.get(`${this.baseUrl}/public/tournaments`);
    }

    getTournament(id: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/public/tournaments/${id}`);
    }

    createTournament(tournament: Tournament): Observable<any> {
        return this.http.post(`${this.baseUrl}/admin/tournaments`, tournament);
    }

    updateTournament(id: number, tournament: Tournament): Observable<any> {
        return this.http.put(`${this.baseUrl}/staff/tournaments/${id}`, tournament);
    }

    deleteTournament(id: number): Observable<any> {
        return this.http.delete(`${this.baseUrl}/admin/tournaments/${id}`);
    }
}
