import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { PaymentsService } from '../../services/payments.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-subscriptions',
  templateUrl: './subscriptions.html',
  styleUrl: './subscriptions.scss',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionsComponent {
  private paymentsService = inject(PaymentsService);
  private authService = inject(AuthService);
  protected readonly isProcessing = signal(false);

  protected activePlan = computed(() => this.authService.currentUser()?.planId);
  protected subscriptionDetails = signal<{ status: string, currentPeriodStart: number, currentPeriodEnd: number, cancelAtPeriodEnd: boolean } | null>(null);

  constructor() {
    effect(() => {
      if (this.activePlan()) {
        this.paymentsService.getSubscription().subscribe({
          next: (details) => this.subscriptionDetails.set(details),
          error: (err) => console.error('Failed to load subscription details', err)
        });
      } else {
        this.subscriptionDetails.set(null);
      }
    });
  }

  protected readonly plans = [
    {
      name: 'Pro',
      price: '$15',
      period: '/mo',
      description: 'Perfect for individuals and small teams.',
      priceId: 'price_1Tsh1w3C6FGO2xjMcR62X9Po',
      features: ['Up to 5 users', 'Basic analytics', '24-hour support response time']
    },
    {
      name: 'Premium',
      price: '$49',
      period: '/mo',
      description: 'Ideal for growing businesses and enterprises.',
      priceId: 'price_1Tsh4Y3C6FGO2xjMaTpgehz2',
      features: ['All Pro features', 'Up to 50 users', 'Priority support', 'Advanced analytics']
    }
  ];

  getCurrentPlan() {
    const planId = this.activePlan();
    if (!planId) return null;
    return this.plans.find(p => p.priceId === planId) || null;
  }

  upgrade(priceId: string) {
    this.isProcessing.set(true);
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
        this.isProcessing.set(false);
      }
    });
  }

  manageBilling() {
    this.isProcessing.set(true);
    const returnUrl = `${window.location.origin}/payments/subscriptions`;
    this.paymentsService.createPortalSession(returnUrl).subscribe({
      next: (res) => {
        if (res.url) {
          window.open(res.url, '_blank');
        }
        this.isProcessing.set(false);
      },
      error: (err) => {
        console.error('Failed to create portal session', err);
        this.isProcessing.set(false);
      }
    });
  }
}
