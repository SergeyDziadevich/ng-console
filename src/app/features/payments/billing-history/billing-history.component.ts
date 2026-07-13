import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { DatePipe, CurrencyPipe, TitleCasePipe } from '@angular/common';
import { PaymentsService } from '../../../services/payments.service';
import { AuthService } from '../../../services/auth.service';

import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap, catchError, finalize, tap, of } from 'rxjs';

@Component({
  selector: 'app-billing-history',
  templateUrl: './billing-history.html',
  styleUrl: './billing-history.scss',
  imports: [DatePipe, CurrencyPipe, TitleCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillingHistoryComponent {
  private paymentsService = inject(PaymentsService);
  private authService = inject(AuthService);

  protected activePlan = computed(() => this.authService.currentUser()?.planId);
  protected loading = signal(false);
  
  protected invoices = toSignal(
    toObservable(this.activePlan).pipe(
      tap(() => this.loading.set(true)),
      switchMap(planId => {
        if (planId) {
          return this.paymentsService.getInvoices().pipe(
            catchError(err => {
              console.error('Failed to load invoices', err);
              return of([]);
            }),
            finalize(() => this.loading.set(false))
          );
        }
        this.loading.set(false);
        return of([]);
      })
    ),
    { initialValue: [] }
  );

  viewInvoice(url: string) {
    window.open(url, '_blank');
  }
}
