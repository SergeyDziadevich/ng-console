import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, EMPTY } from 'rxjs';
import { PaymentsService } from '@app/services/payments.service';

import { TranslatePipe } from '@app/pipes/translate.pipe';

@Component({
  selector: 'app-trial-banner',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './trial-banner.html',
  styleUrl: './trial-banner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrialBanner implements OnInit {
  private readonly paymentsService = inject(PaymentsService);
  protected readonly daysLeft = signal<number | null>(null);
  protected readonly isHidden = signal<boolean>(false);

  ngOnInit() {
    this.paymentsService.getSubscription().pipe(
      catchError(() => EMPTY)
    ).subscribe((sub) => {
      if (sub.status === 'trialing' && sub.trialEnd) {
        const now = Math.floor(Date.now() / 1000);
        const diff = sub.trialEnd - now;
        const days = Math.ceil(diff / (60 * 60 * 24));
        if (days >= 0) {
          this.daysLeft.set(days);
        }
      }
    });
  }

  dismiss() {
    this.isHidden.set(true);
  }
}
