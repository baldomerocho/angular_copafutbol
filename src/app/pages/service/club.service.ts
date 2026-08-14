import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBase } from './api.base';
import { BaseResponse, Paging } from './interfaces/base.interface';
import { ClubRequest, ClubResponse } from './interfaces/team.interface';

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

    getPublicClub(id: number): Observable<BaseResponse<ClubResponse>> {
        return this.http.get<BaseResponse<ClubResponse>>(this.pub(`/clubs/${id}`));
    }
}
