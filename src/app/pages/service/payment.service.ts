import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

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
    getManagerPayments(): Observable<any> {
        const prefix = this.authService.getRolePrefix();
        return this.http.get(`${this.baseUrl}/${prefix}/payments`);
    }

    createPayment(payment: PaymentRequest): Observable<any> {
        const prefix = this.authService.getRolePrefix();
        return this.http.post(`${this.baseUrl}/${prefix}/payments`, payment);
    }

    // Staff/Admin endpoints
    getAllPayments(): Observable<any> {
        const prefix = this.authService.getRolePrefix();
        return this.http.get(`${this.baseUrl}/${prefix}/payments`);
    }

    updatePaymentStatus(id: number, status: string): Observable<any> {
        const prefix = this.authService.getRolePrefix();
        return this.http.patch(`${this.baseUrl}/${prefix}/payments/${id}/status`, { status });
    }
}
