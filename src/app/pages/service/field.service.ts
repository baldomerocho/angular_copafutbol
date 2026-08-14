import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBase } from './api.base';
import { BaseResponse } from './interfaces/base.interface';
import { FieldRequest, FieldResponse } from './interfaces/field.interface';

@Injectable({ providedIn: 'root' })
export class FieldService extends ApiBase {
    getFields(): Observable<BaseResponse<FieldResponse[]>> {
        return this.http.get<BaseResponse<FieldResponse[]>>(this.pub('/fields'));
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
