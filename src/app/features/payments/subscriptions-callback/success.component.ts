import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PaymentsService } from "@ng-console/shared/data-access";
import { AuthService } from "@ng-console/shared/data-access";
import { SpinnerComponent } from "@ng-console/shared/ui";

@Component({
  selector: 'app-payment-success',
  imports: [RouterLink, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          @if (isVerifying()) {
            <app-spinner size="xl" loadingText="Verifying your subscription..."></app-spinner>
          } @else {
            <svg class="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 class="mt-6 text-3xl font-extrabold text-gray-900">Payment Successful!</h2>
            <p class="mt-2 text-sm text-gray-600">
              Thank you for your subscription. Your account has been upgraded.
            </p>
            <div class="mt-6">
              <a routerLink="/payments/subscriptions" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                Go to Subscriptions
              </a>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class PaymentSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private paymentsService = inject(PaymentsService);
  private authService = inject(AuthService);

  protected isVerifying = signal(true);

  ngOnInit() {
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    if (sessionId) {
      this.paymentsService.verifySession(sessionId).subscribe({
        next: (res) => {
          if (res.access_token) {
            localStorage.setItem('auth_token', res.access_token);
            this.authService.currentUser.set(this.authService.decodeToken(res.access_token));
          }
          this.isVerifying.set(false);
        },
        error: (err) => {
          console.error('Failed to verify session', err);
          this.isVerifying.set(false);
        }
      });
    } else {
      this.isVerifying.set(false);
    }
  }
}
