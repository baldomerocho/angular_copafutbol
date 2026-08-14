import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { ConfigService } from '../service/config.service';
import { MatchesWidget } from './components/matcheswidget';
import { StandingsWidget } from './components/standingswidget';
import { StatsWidget } from './components/statswidget';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, StatsWidget, MatchesWidget, StandingsWidget],
    template: `
        <div class="grid grid-cols-12 gap-6">
            <div class="col-span-12">
                <h1 class="text-2xl font-semibold m-0">Hola, {{ userName() }}</h1>
                <p class="text-muted-color mt-1 mb-0">{{ subtitle() }}</p>
            </div>

            <app-stats-widget class="contents" />

            <div class="col-span-12 xl:col-span-7">
                <app-matches-widget />
            </div>
            <div class="col-span-12 xl:col-span-5">
                <app-standings-widget />
            </div>
        </div>
    `
})
export class Dashboard {
    private readonly authService = inject(AuthService);
    private readonly configService = inject(ConfigService);

    userName(): string {
        return this.authService.getUser()?.name ?? '';
    }

    subtitle(): string {
        const platform = this.configService.platformName();
        switch (this.authService.getUserRole()) {
            case 'admin':
                return `Panel de administración de ${platform}.`;
            case 'staff':
                return 'Operación del torneo: calendario, resultados y pagos.';
            default:
                return 'Tus equipos, tus partidos y el estado de tus pagos.';
        }
    }
}
