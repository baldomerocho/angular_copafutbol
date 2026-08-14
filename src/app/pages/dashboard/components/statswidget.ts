import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { ConfigService } from '../../service/config.service';
import { DashboardService } from '../../service/dashboard.service';
import { DashboardStats, StatTile } from '../../service/interfaces/dashboard.interface';

/**
 * Headline numbers for the signed-in role. The API exposes a different dashboard
 * per role, so the tiles are built from whichever payload came back.
 */
@Component({
    standalone: true,
    selector: 'app-stats-widget',
    imports: [CommonModule, RouterModule],
    template: `
        @for (tile of tiles(); track tile.label) {
            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <div class="card mb-0 h-full transition-colors"
                     [class.cursor-pointer]="tile.link"
                     [class.hover:border-primary]="tile.link"
                     [routerLink]="tile.link">
                    <div class="flex justify-between items-start mb-4">
                        <div class="min-w-0">
                            <span class="block text-muted-color font-medium mb-3 text-sm">{{ tile.label }}</span>
                            <div class="text-surface-900 dark:text-surface-0 font-semibold text-2xl tabular-nums">
                                {{ tile.value }}
                            </div>
                        </div>
                        <div class="flex items-center justify-center rounded-border shrink-0"
                             [ngClass]="toneBg(tile.tone)" style="width: 2.5rem; height: 2.5rem">
                            <i [class]="tile.icon + ' text-xl!'" [ngClass]="toneText(tile.tone)"></i>
                        </div>
                    </div>
                    <span class="text-muted-color text-sm">{{ tile.hint }}</span>
                </div>
            </div>
        }

        @if (loading()) {
            <div class="col-span-12">
                <div class="card mb-0 text-center text-muted-color py-6">
                    <i class="pi pi-spin pi-spinner text-2xl"></i>
                </div>
            </div>
        }
    `
})
export class StatsWidget implements OnInit {
    private readonly dashboardService = inject(DashboardService);
    private readonly authService = inject(AuthService);
    private readonly configService = inject(ConfigService);

    readonly stats = signal<DashboardStats | null>(null);
    readonly loading = signal(true);

    readonly tiles = computed<StatTile[]>(() => {
        const data = this.stats();
        if (!data) return [];

        switch (this.authService.getUserRole()) {
            case 'admin':
                return [
                    { label: 'Recaudación aprobada', value: this.money(data.total_revenue), hint: 'Total cobrado', icon: 'pi pi-dollar', tone: 'success', link: '/pages/payments' },
                    { label: 'Pagos pendientes', value: data.pending_payments ?? 0, hint: 'Esperando revisión', icon: 'pi pi-credit-card', tone: 'warn', link: '/pages/payments' },
                    { label: 'Equipos', value: data.total_teams ?? 0, hint: 'En todos los torneos', icon: 'pi pi-users', tone: 'info', link: '/pages/teams' },
                    { label: 'Torneos', value: data.total_tournaments ?? 0, hint: (data.total_users ?? 0) + ' usuarios registrados', icon: 'pi pi-trophy', tone: 'primary', link: '/pages/tournaments' }
                ];
            case 'staff':
                return [
                    { label: 'Torneos activos', value: data.active_tournaments ?? 0, hint: 'En curso ahora', icon: 'pi pi-trophy', tone: 'primary', link: '/pages/tournaments' },
                    { label: 'Próximos partidos', value: data.upcoming_matches ?? 0, hint: 'Ya programados', icon: 'pi pi-calendar', tone: 'info', link: '/pages/matches' },
                    { label: 'Pagos pendientes', value: data.pending_payments ?? 0, hint: 'Esperando revisión', icon: 'pi pi-credit-card', tone: 'warn', link: '/pages/payments' },
                    { label: 'Eventos registrados', value: data.recent_events ?? 0, hint: 'Goles y tarjetas', icon: 'pi pi-flag', tone: 'success', link: '/pages/matches' }
                ];
            default:
                return [
                    { label: 'Mis equipos', value: data.my_teams ?? 0, hint: 'Bajo tu gestión', icon: 'pi pi-users', tone: 'primary', link: '/pages/teams' },
                    { label: 'Jugadores', value: data.total_players ?? 0, hint: 'En tus plantillas', icon: 'pi pi-id-card', tone: 'info', link: '/pages/teams' },
                    { label: 'Próximos partidos', value: data.upcoming_matches ?? 0, hint: 'Ya programados', icon: 'pi pi-calendar', tone: 'success', link: '/pages/matches' },
                    {
                        label: 'Pagos al día',
                        value: Math.round(data.payments_status ?? 0) + '%',
                        hint: 'Aprobado sobre lo registrado',
                        icon: 'pi pi-wallet',
                        tone: (data.payments_status ?? 0) >= 100 ? 'success' : 'warn',
                        link: '/pages/payments'
                    }
                ];
        }
    });

    ngOnInit() {
        this.dashboardService.getStats().subscribe({
            next: (res) => {
                this.stats.set(res.data ?? {});
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    private money(value: number | undefined): string {
        const amount = value ?? 0;
        return this.configService.currencySymbol() + amount.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    toneBg(tone: StatTile['tone']): string {
        return {
            primary: 'bg-primary-100 dark:bg-primary-400/10',
            success: 'bg-green-100 dark:bg-green-400/10',
            warn: 'bg-orange-100 dark:bg-orange-400/10',
            danger: 'bg-red-100 dark:bg-red-400/10',
            info: 'bg-blue-100 dark:bg-blue-400/10'
        }[tone];
    }

    toneText(tone: StatTile['tone']): string {
        return {
            primary: 'text-primary',
            success: 'text-green-500',
            warn: 'text-orange-500',
            danger: 'text-red-500',
            info: 'text-blue-500'
        }[tone];
    }
}
