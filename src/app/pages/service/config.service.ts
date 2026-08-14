import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiBase } from './api.base';
import { BaseResponse } from './interfaces/base.interface';
import { Metadata } from './interfaces/catalog.interface';
import { AppConfig, Setting, SettingUpdateRequest } from './interfaces/config.interface';

@Injectable({ providedIn: 'root' })
export class ConfigService extends ApiBase {
    /** Platform branding, loaded once at boot and read by the layout. */
    readonly appConfig = signal<AppConfig | null>(null);

    fetchAppConfig(): Observable<BaseResponse<Metadata<AppConfig>>> {
        return this.http.get<BaseResponse<Metadata<AppConfig>>>(this.pub('/settings/app')).pipe(
            tap((res) => {
                const metadata = res?.data?.metadata;
                if (metadata) {
                    this.appConfig.set(metadata);
                    this.applyPrimaryColor(metadata.primary_color);
                }
            })
        );
    }

    platformName(): string {
        return this.appConfig()?.platform_name || 'Copa Fútbol';
    }

    currencySymbol(): string {
        return this.appConfig()?.currency_symbol || '$';
    }

    /** Settings administration is admin-only, so the prefix is fixed. */
    getSettings(): Observable<BaseResponse<Setting[]>> {
        return this.http.get<BaseResponse<Setting[]>>(`${this.baseUrl}/admin/settings`);
    }

    updateSetting(key: string, metadata: unknown): Observable<BaseResponse<Setting>> {
        const body: SettingUpdateRequest = { key, metadata };
        return this.http.post<BaseResponse<Setting>>(`${this.baseUrl}/admin/settings`, body);
    }

    /**
     * Paints the configured brand colour over the Aura palette. Only the base tone
     * is derived here; the theme keeps its own hover and active steps.
     */
    private applyPrimaryColor(color?: string) {
        if (!color) return;
        document.documentElement.style.setProperty('--p-primary-color', color);
    }
}
