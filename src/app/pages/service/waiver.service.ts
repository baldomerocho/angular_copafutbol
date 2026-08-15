import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBase } from './api.base';
import { BaseResponse, Paging } from './interfaces/base.interface';

export type WaiverStatus = 'pending' | 'approved' | 'rejected';

/** A request to register a player the tournament's squad rules would stop. */
export interface RegistrationWaiverResponse {
    id: number;
    tournament_id: number;
    tournament_name: string;
    team_id: number;
    team_name: string;
    player_id: number;
    player_name: string;
    /** The rule that triggered it, and the rate card code the charge comes from. */
    rule: string;
    detail: string;
    reason: string;
    status: WaiverStatus;
    fee_amount: number;
    currency?: string;
    payment_id?: number;
    payment_status?: string;
    notes: string;
    resolved_at?: string | null;
    created_at: string;
}

export interface WaiverFilters extends Paging {
    tournament_id?: number;
    team_id?: number;
    status?: WaiverStatus;
}

/**
 * Authorisation requests. A delegate raises one by registering someone the rules
 * stop; only staff and admin resolve them.
 */
@Injectable({ providedIn: 'root' })
export class WaiverService extends ApiBase {
    getWaivers(filters?: WaiverFilters): Observable<BaseResponse<RegistrationWaiverResponse[]>> {
        return this.http.get<BaseResponse<RegistrationWaiverResponse[]>>(this.scoped('/waivers'), {
            params: this.params(filters)
        });
    }

    approve(id: number, notes?: string): Observable<BaseResponse<RegistrationWaiverResponse>> {
        return this.http.post<BaseResponse<RegistrationWaiverResponse>>(
            this.scoped(`/waivers/${id}/approve`), { notes: notes ?? '' });
    }

    reject(id: number, notes?: string): Observable<BaseResponse<RegistrationWaiverResponse>> {
        return this.http.post<BaseResponse<RegistrationWaiverResponse>>(
            this.scoped(`/waivers/${id}/reject`), { notes: notes ?? '' });
    }
}
