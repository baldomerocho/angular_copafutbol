import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { BaseResponse } from './interfaces/base.interface';
import { PaymentResponse, PaymentRequest } from './interfaces/payment.interface';

@Injectable({
    providedIn: 'root'
})
export class PaymentService {
    private baseUrl = environment.apiUrl;

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    // Manager endpoints
    getManagerPayments(): Observable<BaseResponse<PaymentResponse[]>> {
        const prefix = this.authService.getRolePrefix();
        return this.http.get(`${this.baseUrl}/${prefix}/payments`) as Observable<BaseResponse<PaymentResponse[]>>;
    }

    createPayment(payment: PaymentRequest): Observable<BaseResponse<PaymentResponse>> {
        const prefix = this.authService.getRolePrefix();
        return this.http.post(`${this.baseUrl}/${prefix}/payments`, payment) as Observable<BaseResponse<PaymentResponse>>;
    }

    // Staff/Admin endpoints
    getAllPayments(): Observable<BaseResponse<PaymentResponse[]>> {
        const prefix = this.authService.getRolePrefix();
        return this.http.get(`${this.baseUrl}/${prefix}/payments`) as Observable<BaseResponse<PaymentResponse[]>>;
    }

    updatePaymentStatus(id: number, status: string): Observable<BaseResponse<any>> {
        const prefix = this.authService.getRolePrefix();
        return this.http.patch(`${this.baseUrl}/${prefix}/payments/${id}/status`, { status }) as Observable<BaseResponse<any>>;
    }
}
