import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBase } from './api.base';
import { BaseResponse } from './interfaces/base.interface';
import { PaymentRequest, PaymentResponse } from './interfaces/payment.interface';

@Injectable({ providedIn: 'root' })
export class PaymentService extends ApiBase {
    /**
     * One endpoint for every role: the API returns only the caller's own payments
     * when the caller is a manager, and all of them for staff and admin.
     */
    getPayments(): Observable<BaseResponse<PaymentResponse[]>> {
        return this.http.get<BaseResponse<PaymentResponse[]>>(this.scoped('/payments'));
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
