import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { DatePipe, CurrencyPipe, TitleCasePipe } from '@angular/common';
import { PaymentsService } from '../../../services/payments.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-billing-history',
  templateUrl: './billing-history.html',
  styleUrl: './billing-history.scss',
  standalone: true,
  imports: [DatePipe, CurrencyPipe, TitleCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillingHistoryComponent {
  private paymentsService = inject(PaymentsService);
  private authService = inject(AuthService);

  protected activePlan = computed(() => this.authService.currentUser()?.planId);
  protected loading = signal(false);
  protected invoices = signal<Array<{ id: string, amountPaid: number, status: string, created: number, hostedInvoiceUrl: string, invoicePdf: string }>>([]);

  constructor() {
    effect(() => {
      if (this.activePlan()) {
        this.loading.set(true);
        this.paymentsService.getInvoices().subscribe({
          next: (invoices) => {
            this.invoices.set(invoices);
            this.loading.set(false);
          },
          error: (err) => {
            console.error('Failed to load invoices', err);
            this.loading.set(false);
          }
        });
      } else {
        this.invoices.set([]);
      }
    }, { allowSignalWrites: true });
  }
}
