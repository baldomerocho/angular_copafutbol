import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBase } from './api.base';
import { BaseResponse, Paging } from './interfaces/base.interface';

export interface AuditLogResponse {
    id: number;
    user_email: string;
    action: string;
    entity: string;
    entity_id: number;
    old_value: string;
    new_value: string;
    timestamp: string;
}

export interface AuditFilters extends Paging {
    entity?: string;
    action?: string;
    user_id?: number;
}

@Injectable({ providedIn: 'root' })
export class AuditService extends ApiBase {
    /** The audit trail is admin-only, so the prefix is fixed. */
    getLogs(filters?: AuditFilters): Observable<BaseResponse<AuditLogResponse[]>> {
        return this.http.get<BaseResponse<AuditLogResponse[]>>(`${this.baseUrl}/admin/audit-logs`, {
            params: this.params(filters)
        });
    }
}
