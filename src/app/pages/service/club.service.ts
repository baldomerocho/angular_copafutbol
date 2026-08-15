import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBase } from './api.base';
import { BaseResponse, Paging } from './interfaces/base.interface';
import { ClubPlayerRequest, ClubPlayerResponse, ClubRequest, ClubResponse, CopyPoolResponse } from './interfaces/team.interface';

export interface ClubFilters extends Paging {
    search?: string;
}

@Injectable({ providedIn: 'root' })
export class ClubService extends ApiBase {
    /** Managers see only their own clubs; staff and admin see all of them. */
    getClubs(filters?: ClubFilters): Observable<BaseResponse<ClubResponse[]>> {
        return this.http.get<BaseResponse<ClubResponse[]>>(this.scoped('/clubs'), {
            params: this.params(filters)
        });
    }

    getClub(id: number): Observable<BaseResponse<ClubResponse>> {
        return this.http.get<BaseResponse<ClubResponse>>(this.scoped(`/clubs/${id}`));
    }

    createClub(club: ClubRequest): Observable<BaseResponse<ClubResponse>> {
        return this.http.post<BaseResponse<ClubResponse>>(this.scoped('/clubs'), club);
    }

    updateClub(id: number, club: ClubRequest): Observable<BaseResponse<ClubResponse>> {
        return this.http.put<BaseResponse<ClubResponse>>(this.scoped(`/clubs/${id}`), club);
    }

    deleteClub(id: number): Observable<BaseResponse<ClubResponse>> {
        return this.http.delete<BaseResponse<ClubResponse>>(this.scoped(`/clubs/${id}`));
    }

    // --- The club's books ---
    //
    // The pool that persists between tournaments. A tournament entry copies from
    // here, which is what stops a delegate retyping fifty people every season.

    getPool(clubId: number, includeInactive = false): Observable<BaseResponse<ClubPlayerResponse[]>> {
        return this.http.get<BaseResponse<ClubPlayerResponse[]>>(this.scoped(`/clubs/${clubId}/players`), {
            params: this.params({ include_inactive: includeInactive || undefined })
        });
    }

    addToPool(clubId: number, player: ClubPlayerRequest): Observable<BaseResponse<ClubPlayerResponse>> {
        return this.http.post<BaseResponse<ClubPlayerResponse>>(this.scoped(`/clubs/${clubId}/players`), player);
    }

    updatePoolPlayer(clubId: number, playerId: number, player: ClubPlayerRequest): Observable<BaseResponse<ClubPlayerResponse>> {
        return this.http.put<BaseResponse<ClubPlayerResponse>>(this.scoped(`/clubs/${clubId}/players/${playerId}`), player);
    }

    removeFromPool(clubId: number, playerId: number): Observable<BaseResponse<string>> {
        return this.http.delete<BaseResponse<string>>(this.scoped(`/clubs/${clubId}/players/${playerId}`));
    }

    /** Enters club players into one of its tournament squads. */
    copyToTeam(clubId: number, teamId: number, playerIds?: number[], reason?: string): Observable<BaseResponse<CopyPoolResponse>> {
        return this.http.post<BaseResponse<CopyPoolResponse>>(
            this.scoped(`/clubs/${clubId}/players/copy/${teamId}`),
            { player_ids: playerIds ?? [], reason: reason ?? '' });
    }

    getPublicClub(id: number): Observable<BaseResponse<ClubResponse>> {
        return this.http.get<BaseResponse<ClubResponse>>(this.pub(`/clubs/${id}`));
    }
}
