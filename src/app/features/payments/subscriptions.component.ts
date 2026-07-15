import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { PaymentsService } from '../../services/payments.service';
import { AuthService } from '../../services/auth.service';

import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap, catchError, of } from 'rxjs';

@Component({
  selector: 'app-subscriptions',
  templateUrl: './subscriptions.html',
  styleUrl: './subscriptions.scss',
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionsComponent {
  private paymentsService = inject(PaymentsService);
  private authService = inject(AuthService);
  protected readonly processingAction = signal<string | null>(null);

  protected activePlan = computed(() => this.authService.currentUser()?.planId);

  protected subscriptionDetails = toSignal(
    toObservable(this.activePlan).pipe(
      switchMap(planId => {
        if (planId) {
          return this.paymentsService.getSubscription().pipe(
            catchError(err => {
              console.error('Failed to load subscription details', err);
              return of(null);
            })
          );
        }
        return of(null);
      })
    ),
    { initialValue: null }
  );

  protected readonly plans = [
    {
      name: 'Pro',
      price: '$15',
      period: '/mo',
      description: 'Perfect for individuals and small teams.',
      priceId: 'prod_UslrVmFkf4aJP4',
      legacyProductIds: ['prod_UsRvdBSVty1VzW'],
      features: ['Up to 5 users', 'Basic analytics', '24-hour support response time']
    },
    {
      name: 'Premium',
      price: '$49',
      period: '/mo',
      description: 'Ideal for growing businesses and enterprises.',
      priceId: 'prod_Uslsp82BoehihT',
      legacyProductIds: ['prod_UsRyuBESD2VCNb'],
      features: ['All Pro features', 'Up to 50 users', 'Priority support', 'Advanced analytics']
    },
    {
      name: 'Free Trial',
      price: '$0',
      period: 'for 5 days',
      description: 'Experience all Premium features risk-free.',
      priceId: 'prod_UsbPH1vWd8WShB',
      legacyProductIds: [],
      features: ['Full platform access', 'Up to 50 users', 'Cancel anytime']
    }
  ];

  getCurrentPlan() {
    const planId = this.subscriptionDetails()?.productId || this.activePlan();
    if (!planId) return null;
    return this.plans.find(p => p.priceId === planId || p.legacyProductIds?.includes(planId)) || null;
  }

  upgrade(priceId: string) {
    this.processingAction.set(priceId);
    const successUrl = `${window.location.origin}/payments/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${window.location.origin}/payments/cancel`;

    this.paymentsService.createCheckoutSession(priceId, successUrl, cancelUrl).subscribe({
      next: (res) => {
        if (res.url) {
          window.location.href = res.url;
        }
      },
      error: (err) => {
        console.error('Failed to create checkout session', err);
        this.processingAction.set(null);
      }
    });
  }

  manageBilling() {
    this.processingAction.set('billing');
    const returnUrl = `${window.location.origin}/payments/subscriptions`;
    this.paymentsService.createPortalSession(returnUrl).subscribe({
      next: (res) => {
        if (res.url) {
          window.open(res.url, '_blank');
        }
        this.processingAction.set(null);
      },
      error: (err) => {
        console.error('Failed to create portal session', err);
        this.processingAction.set(null);
      }
    });
  }
}
