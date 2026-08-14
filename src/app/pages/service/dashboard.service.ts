import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBase } from './api.base';
import { BaseResponse } from './interfaces/base.interface';
import { DashboardStats } from './interfaces/dashboard.interface';

@Injectable({ providedIn: 'root' })
export class DashboardService extends ApiBase {
    /**
     * Each role has its own dashboard endpoint under its own prefix, so the role
     * prefix already selects the right one.
     */
    getStats(): Observable<BaseResponse<DashboardStats>> {
        return this.http.get<BaseResponse<DashboardStats>>(this.scoped('/dashboard'));
    }
}
