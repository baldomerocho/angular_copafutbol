import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';
import { appRoutes } from './app.routes';
import { authInterceptor } from './app/pages/auth/auth.interceptor';
import { CatalogService } from './app/pages/service/catalog.service';
import { ConfigService } from './app/pages/service/config.service';

export function initializeCatalogs(catalogService: CatalogService) {
    return () => catalogService.fetchCatalogs();
}

export function initializeAppConfig(configService: ConfigService) {
    return () => configService.fetchAppConfig();
}

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(appRoutes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }), withEnabledBlockingInitialNavigation()),
        provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
        provideAnimationsAsync(),
        providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } } }),
        MessageService,
        {
            provide: APP_INITIALIZER,
            useFactory: initializeAppConfig,
            deps: [ConfigService],
            multi: true
        },
        {
            provide: APP_INITIALIZER,
            useFactory: initializeCatalogs,
            deps: [CatalogService],
            multi: true
        }
    ]
};
