import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService, ConfirmationService } from 'primeng/api';
import { FluidModule } from 'primeng/fluid';
import { PaymentService } from '../service/payment.service';
import { PaymentResponse, PaymentRequest } from '../service/interfaces/payment.interface';
import { AuthService } from '../service/auth.service';
import { TournamentService } from '../service/tournament.service';
import { TournamentResponse } from '../service/interfaces/tournament.interface';
import { TeamService } from '../service/team.service';
import { TeamResponse } from '../service/interfaces/team.interface';
import { CatalogService } from '../service/catalog.service';

@Component({
    selector: 'app-payments',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, DialogModule, ToastModule, ToolbarModule, ConfirmDialogModule, SelectModule, TagModule, DatePickerModule, FluidModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './payments.html',
    styleUrl: './payments.css'
})
export class Payments implements OnInit {
    payments: PaymentResponse[] = [];
    payment: any = {}; // Using any for form model
    paymentDialog: boolean = false;
    statusDialog: boolean = false;
    loading: boolean = true;
    paymentDate: Date = new Date();
    userRole: string = '';

    tournaments: TournamentResponse[] = [];
    teams: TeamResponse[] = [];

    constructor(
        private paymentService: PaymentService,
        private authService: AuthService,
        private tournamentService: TournamentService,
        private teamService: TeamService,
        private catalogService: CatalogService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) { }

    ngOnInit() {
        this.userRole = this.authService.getUserRole() || '';
        this.loadInitialData();
        this.loadPayments();
    }

    loadInitialData() {
        this.tournamentService.getTournaments().subscribe(res => this.tournaments = res.data || []);
        if (this.userRole === 'manager') {
            this.teamService.getTeams().subscribe(res => this.teams = res.data || []);
        }
    }

    loadPayments() {
        this.loading = true;
        const obs = (this.userRole === 'manager')
            ? this.paymentService.getManagerPayments()
            : this.paymentService.getAllPayments();

        obs.subscribe({
            next: (res) => {
                this.payments = res.data || [];
                this.loading = false;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los pagos' });
                this.loading = false;
            }
        });
    }

    getTournamentName(id: number) { return this.tournaments.find(t => t.id === id)?.name || id; }
    getTeamName(id: number) { return this.teams.find(t => t.id === id)?.name || id; }

    getStatusName(id: string) {
        return this.catalogService.getCatalog('payment_statuses').find(s => s.id === id)?.name || id;
    }

    getSeverity(status: string) {
        if (!status) return 'info';
        const s = status.toLowerCase();
        switch (s) {
            case 'approved':
            case 'completed':
                return 'success';
            case 'pending':
                return 'warn';
            case 'rejected':
            case 'refused':
            case 'cancelled':
            case 'danger':
                return 'danger';
            default:
                return 'info';
        }
    }

    paymentTypes() {
        console.log(this.catalogService.getCatalog('payment_types'));
        return this.catalogService.getCatalog('payment_types');
    }

    paymentStatuses() {
        console.log(this.catalogService.getCatalog('payment_statuses'));
        return this.catalogService.getCatalog('payment_statuses');
    }

    openNew() {
        this.payment = { team_id: 0, tournament_id: 0, amount: 0, external_id: '', type: 'enrollment', status: 'pending' };
        this.paymentDate = new Date();
        this.paymentDialog = true;
    }

    editStatus(payment: PaymentResponse) {
        this.payment = { ...payment };
        this.statusDialog = true;
    }

    hideDialog() {
        this.paymentDialog = false;
        this.statusDialog = false;
    }

    savePayment() {
        if (!this.payment.team_id || !this.payment.tournament_id || !this.payment.amount || !this.payment.external_id) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Complete los campos obligatorios' });
            return;
        }

        const request: PaymentRequest = {
            amount: this.payment.amount,
            team_id: this.payment.team_id,
            tournament_id: this.payment.tournament_id,
            type: this.payment.type,
            external_id: this.payment.external_id
        };
        this.loading = true;

        this.paymentService.createPayment(request).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Pago registrado correctamente' });
                this.loadPayments();
                this.paymentDialog = false;
                this.loading = false;
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al registrar pago' });
                this.loading = false;
            }
        });
    }

    updateStatus() {
        if (!this.payment.id || !this.payment.status) return;

        this.loading = true;
        this.paymentService.updatePaymentStatus(this.payment.id, this.payment.status).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Estado actualizado' });
                this.loadPayments();
                this.statusDialog = false;
                this.loading = false;
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al actualizar estado' });
                this.loading = false;
            }
        });
    }
}
