import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBase } from './api.base';
import { BaseResponse, Paging } from './interfaces/base.interface';
import { PlayerProfileResponse } from './interfaces/match.interface';
import { PlayerRequest, PlayerResponse } from './interfaces/team.interface';

export interface PlayerFilters extends Paging {
    search?: string;
    document?: string;
}

/**
 * Players are people, not squad members. Registering one on a squad goes through
 * TeamService; this service is about the person themselves.
 */
@Injectable({ providedIn: 'root' })
export class PlayerService extends ApiBase {
    /** Look someone up before registering them, so one human is not stored twice. */
    search(filters?: PlayerFilters): Observable<BaseResponse<PlayerResponse[]>> {
        return this.http.get<BaseResponse<PlayerResponse[]>>(this.scoped('/players'), {
            params: this.params(filters)
        });
    }

    getPlayer(id: number): Observable<BaseResponse<PlayerResponse>> {
        return this.http.get<BaseResponse<PlayerResponse>>(this.pub(`/players/${id}`));
    }

    updatePlayer(id: number, player: PlayerRequest): Observable<BaseResponse<PlayerResponse>> {
        return this.http.put<BaseResponse<PlayerResponse>>(this.scoped(`/players/${id}`), player);
    }

    /** The player's card: their squads and a record per tournament. */
    getProfile(id: number): Observable<BaseResponse<PlayerProfileResponse>> {
        return this.http.get<BaseResponse<PlayerProfileResponse>>(this.pub(`/players/${id}/profile`));
    }
}
