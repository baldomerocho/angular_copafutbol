import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    standalone: true,
    selector: 'app-stats-widget',
    imports: [CommonModule],
    template: `<div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Partidos Hoy</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">12</div>
                    </div>
                    <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-calendar text-blue-500 text-xl!"></i>
                    </div>
                </div>
                <span class="text-primary font-medium">4 en curso </span>
                <span class="text-muted-color">ahora mismo</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Equipos</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">48</div>
                    </div>
                    <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-users text-orange-500 text-xl!"></i>
                    </div>
                </div>
                <span class="text-primary font-medium">3 nuevos </span>
                <span class="text-muted-color">esta semana</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Torneos</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">4</div>
                    </div>
                    <div class="flex items-center justify-center bg-cyan-100 dark:bg-cyan-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-trophy text-cyan-500 text-xl!"></i>
                    </div>
                </div>
                <span class="text-primary font-medium">1 activo </span>
                <span class="text-muted-color">actualmente</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Goles</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">152</div>
                    </div>
                    <div class="flex items-center justify-center bg-purple-100 dark:bg-purple-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-star text-purple-500 text-xl!"></i>
                    </div>
                </div>
                <span class="text-primary font-medium">28 </span>
                <span class="text-muted-color">esta jornada</span>
            </div>
        </div>`
})
export class StatsWidget { }
