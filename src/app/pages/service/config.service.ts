import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseResponse } from './interfaces/base.interface';
import { AppConfig, Setting, SettingUpdateRequest } from './interfaces/config.interface';
import { Metadata } from './interfaces/catalog.interface';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class ConfigService {
    private baseUrl = environment.apiUrl;

    // Global app configuration Signal
    appConfig = signal<AppConfig | null>(null);

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    fetchAppConfig(): Observable<BaseResponse<Metadata<AppConfig>>> {
        return this.http.get<BaseResponse<Metadata<AppConfig>>>(`${this.baseUrl}/public/settings/app`).pipe(
            tap(res => {
                if (res.data?.metadata) {
                    this.appConfig.set(res.data.metadata);
                    this.applyPrimaryColor(res.data.metadata.primary_color);
                }
            })
        );
    }

    private applyPrimaryColor(color: string) {
        if (color) {
            // Apply to CSS variables for PrimeNG Aura theme
            const root = document.documentElement;
            root.style.setProperty('--p-primary-color', color);
            // Also update hover/active states if possible, or just the main primary
        }
    }

    getAdminSettings(): Observable<BaseResponse<Setting[]>> {
        const prefix = this.authService.getRolePrefix();
        return this.http.get<BaseResponse<Setting[]>>(`${this.baseUrl}/${prefix}/settings`);
    }

    updateSetting(key: string, metadata: any): Observable<BaseResponse<any>> {
        const prefix = this.authService.getRolePrefix();
        const body: SettingUpdateRequest = { key, metadata };
        return this.http.post<BaseResponse<any>>(`${this.baseUrl}/${prefix}/settings`, body);
    }
}
