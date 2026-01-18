export interface AppConfig {
    currency_symbol: string;
    logo_url: string;
    platform_name: string;
    primary_color: string;
}

export interface Setting {
    key: string;
    metadata: any;
}

export interface SettingUpdateRequest {
    key: string;
    metadata: any;
}
