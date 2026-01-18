import { Component } from '@angular/core';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';

@Component({
    standalone: true,
    selector: 'app-recent-sales-widget',
    imports: [CommonModule, TableModule, ButtonModule, RippleModule],
    template: `<div class="card mb-8!">
        <div class="font-semibold text-xl mb-4">Últimos Resultados</div>
        <p-table [value]="matches" [rows]="5" responsiveLayout="scroll">
            <ng-template #header>
                <tr>
                    <th>Local</th>
                    <th></th>
                    <th>Visitante</th>
                    <th>Fecha</th>
                    <th>Ver</th>
                </tr>
            </ng-template>
            <ng-template #body let-match>
                <tr>
                    <td style="width: 35%; min-width: 7rem;">{{ match.local }}</td>
                    <td style="width: 15%; min-width: 5rem;" class="text-center font-bold">
                        {{ match.scoreLocal }} - {{ match.scoreVisitor }}
                    </td>
                    <td style="width: 35%; min-width: 7rem;">{{ match.visitor }}</td>
                    <td style="width: 15%; min-width: 8rem;">{{ match.date }}</td>
                    <td style="width: 10%;">
                        <button pButton pRipple type="button" icon="pi pi-search" class="p-button p-component p-button-text p-button-icon-only"></button>
                    </td>
                </tr>
            </ng-template>
        </p-table>
    </div>`
})
export class RecentSalesWidget {
    matches: any[] = [
        { local: 'Equipo A', scoreLocal: 2, scoreVisitor: 1, visitor: 'Equipo B', date: 'hoy' },
        { local: 'Equipo C', scoreLocal: 0, scoreVisitor: 3, visitor: 'Equipo D', date: 'ayer' },
        { local: 'Equipo E', scoreLocal: 1, scoreVisitor: 1, visitor: 'Equipo F', date: 'ayer' },
        { local: 'Equipo G', scoreLocal: 4, scoreVisitor: 2, visitor: 'Equipo H', date: 'domingo' },
        { local: 'Equipo I', scoreLocal: 0, scoreVisitor: 0, visitor: 'Equipo J', date: 'domingo' }
    ];

    constructor() { }

    ngOnInit() { }
}
