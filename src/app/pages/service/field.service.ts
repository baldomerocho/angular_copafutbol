import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBase } from './api.base';
import { BaseResponse, Paging } from './interfaces/base.interface';
import { FieldRequest, FieldResponse } from './interfaces/field.interface';

export interface FieldFilters extends Paging {
    search?: string;
}

@Injectable({ providedIn: 'root' })
export class FieldService extends ApiBase {
    getFields(filters?: FieldFilters): Observable<BaseResponse<FieldResponse[]>> {
        return this.http.get<BaseResponse<FieldResponse[]>>(this.pub('/fields'), {
            params: this.params(filters)
        });
    }

    getField(id: number): Observable<BaseResponse<FieldResponse>> {
        return this.http.get<BaseResponse<FieldResponse>>(this.pub(`/fields/${id}`));
    }

    createField(field: FieldRequest): Observable<BaseResponse<FieldResponse>> {
        return this.http.post<BaseResponse<FieldResponse>>(this.scoped('/fields'), field);
    }

    updateField(id: number, field: FieldRequest): Observable<BaseResponse<FieldResponse>> {
        return this.http.put<BaseResponse<FieldResponse>>(this.scoped(`/fields/${id}`), field);
    }

    deleteField(id: number): Observable<BaseResponse<FieldResponse>> {
        return this.http.delete<BaseResponse<FieldResponse>>(this.scoped(`/fields/${id}`));
    }
}
