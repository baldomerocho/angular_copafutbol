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
    private apiUrl = 'https://app-dev-clubfutbol.server.gt/tournaments';

    constructor(private http: HttpClient) { }

    getTournaments(): Observable<any> {
        return this.http.get(this.apiUrl);
    }

    getTournament(id: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/${id}`);
    }

    createTournament(tournament: Tournament): Observable<any> {
        return this.http.post(this.apiUrl, tournament);
    }

    updateTournament(id: number, tournament: Tournament): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, tournament);
    }

    deleteTournament(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}
