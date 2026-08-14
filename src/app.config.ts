import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import Aura from '@primeuix/themes/aura';
import { ConfirmationService, MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { catchError, forkJoin, of } from 'rxjs';
import { appRoutes } from './app.routes';
import { authInterceptor } from './app/pages/auth/auth.interceptor';
import { CatalogService } from './app/pages/service/catalog.service';
import { ConfigService } from './app/pages/service/config.service';

/**
 * Branding and catalogs load before the first render, so the topbar shows the right
 * name and every dropdown has its Spanish labels. Both tolerate failure: an API
 * that is still starting should not stop the user from reaching the login screen.
 */
function loadPlatformData() {
    const config = inject(ConfigService);
    const catalogs = inject(CatalogService);

    return forkJoin([
        config.fetchAppConfig().pipe(catchError(() => of(null))),
        catalogs.fetchCatalogs().pipe(catchError(() => of(null)))
    ]);
}

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(
            appRoutes,
            withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
            withEnabledBlockingInitialNavigation()
        ),
        provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
        provideAnimationsAsync(),
        providePrimeNG({
            theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } },
            translation: {
                dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
                dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
                dayNamesMin: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
                monthNames: [
                    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                ],
                monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
                today: 'Hoy',
                clear: 'Limpiar',
                weekHeader: 'Sm',
                firstDayOfWeek: 1,
                emptyMessage: 'Sin resultados',
                emptyFilterMessage: 'Sin coincidencias'
            }
        }),
        MessageService,
        ConfirmationService,
        provideAppInitializer(loadPlatformData)
    ]
};
