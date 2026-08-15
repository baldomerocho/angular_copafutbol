import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBase } from './api.base';
import { BaseResponse, Paging } from './interfaces/base.interface';
import { PaymentRequest, PaymentResponse } from './interfaces/payment.interface';

export interface PaymentFilters extends Paging {
    status?: string;
    type?: string;
    tournament_id?: number;
    search?: string;
}

export interface PaymentSummaryResponse {
    approved: number;
    pending: number;
    rejected: number;
    count: number;
}

@Injectable({ providedIn: 'root' })
export class PaymentService extends ApiBase {
    /**
     * One endpoint for every role: the API returns only the caller's own payments
     * when the caller is a manager, and all of them for staff and admin.
     */
    getPayments(filters?: PaymentFilters): Observable<BaseResponse<PaymentResponse[]>> {
        return this.http.get<BaseResponse<PaymentResponse[]>>(this.scoped('/payments'), {
            params: this.params(filters)
        });
    }

    /**
     * Totals over every payment matching the filters. The table only holds one page,
     * so summing its rows in the browser would understate the money on screen.
     */
    getSummary(filters?: PaymentFilters): Observable<BaseResponse<PaymentSummaryResponse>> {
        return this.http.get<BaseResponse<PaymentSummaryResponse>>(this.scoped('/payments/summary'), {
            params: this.params(filters)
        });
    }

    getPayment(id: number): Observable<BaseResponse<PaymentResponse>> {
        return this.http.get<BaseResponse<PaymentResponse>>(this.scoped(`/payments/${id}`));
    }

    createPayment(payment: PaymentRequest): Observable<BaseResponse<PaymentResponse>> {
        return this.http.post<BaseResponse<PaymentResponse>>(this.scoped('/payments'), payment);
    }

    updatePayment(id: number, payment: PaymentRequest): Observable<BaseResponse<PaymentResponse>> {
        return this.http.put<BaseResponse<PaymentResponse>>(this.scoped(`/payments/${id}`), payment);
    }

    updatePaymentStatus(id: number, status: string): Observable<BaseResponse<PaymentResponse>> {
        return this.http.patch<BaseResponse<PaymentResponse>>(this.scoped(`/payments/${id}/status`), { status });
    }

    deletePayment(id: number): Observable<BaseResponse<void>> {
        return this.http.delete<BaseResponse<void>>(this.scoped(`/payments/${id}`));
    }
}
