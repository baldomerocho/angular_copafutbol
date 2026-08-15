/** Branding served from the `app` setting and applied at boot. */
export interface AppConfig {
    platform_name: string;
    logo_url: string;
    currency_symbol: string;
    primary_color: string;
    contact_email?: string;
    contact_phone?: string;
    /** Public site the footer links back to. */
    website_url?: string;
}

export interface Setting {
    id?: number;
    key: string;
    metadata: Record<string, unknown> | null;
}

export interface SettingUpdateRequest {
    key: string;
    metadata: unknown;
}
