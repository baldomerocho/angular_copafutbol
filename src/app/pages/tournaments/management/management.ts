import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { FluidModule } from 'primeng/fluid';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';
import { TournamentService } from '../../service/tournament.service';
import { CatalogService } from '../../service/catalog.service';
import { TournamentResponse, TournamentRequest } from '../../service/interfaces/tournament.interface';

@Component({
    selector: 'app-tournament-management',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        ButtonModule,
        InputTextModule,
        InputNumberModule,
        DatePickerModule,
        SelectModule,
        ToastModule,
        FluidModule,
        TextareaModule
    ],
    providers: [MessageService],
    templateUrl: './management.html'
})
export class TournamentManagement implements OnInit {
    tournament: any = {
        name: '',
        description: '',
        location: '',
        start_date: '',
        end_date: '',
        max_teams: undefined,
        enrollment_price: undefined,
        status: 'pending',
        extra_prices: []
    };

    isEdit: boolean = false;
    loading: boolean = false;

    constructor(
        private tournamentService: TournamentService,
        private catalogService: CatalogService,
        private messageService: MessageService,
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit() {
        const id = this.route.snapshot.params['id'];
        if (id) {
            this.isEdit = true;
            this.loadTournament(id);
        }
    }

    loadTournament(id: number) {
        this.loading = true;
        this.tournamentService.getTournament(id).subscribe({
            next: (res) => {
                this.tournament = res.data;
                this.loading = false;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el torneo' });
                this.loading = false;
            }
        });
    }

    statuses() {
        return this.catalogService.getCatalog('tournament_statuses');
    }

    addExtraPrice() {
        if (!this.tournament.extra_prices) {
            this.tournament.extra_prices = [];
        }
        this.tournament.extra_prices.push({ name: '', amount: 0 });
    }

    removeExtraPrice(index: number) {
        this.tournament.extra_prices.splice(index, 1);
    }

    saveTournament() {
        if (!this.tournament.name) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'El nombre es obligatorio' });
            return;
        }

        this.loading = true;

        // Clean the request object
        const request: TournamentRequest = {
            ...this.tournament,
            extra_prices: this.tournament.extra_prices?.map((ep: any) => ({
                name: ep.name,
                amount: ep.amount
            }))
        };

        const observable = this.isEdit
            ? this.tournamentService.updateTournament(this.tournament.id!, request)
            : this.tournamentService.createTournament(request);

        observable.subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Torneo ${this.isEdit ? 'actualizado' : 'creado'} correctamente` });
                setTimeout(() => this.router.navigate(['/pages/tournaments']), 1500);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error al guardar' });
                this.loading = false;
            }
        });
    }
}
