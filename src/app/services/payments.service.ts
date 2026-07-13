import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/payments`;

  createCheckoutSession(priceId: string, successUrl: string, cancelUrl: string): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${this.apiUrl}/create-checkout-session`, {
      priceId,
      successUrl,
      cancelUrl
    });
  }

  verifySession(sessionId: string): Observable<{ access_token: string }> {
    return this.http.post<{ access_token: string }>(`${this.apiUrl}/verify-session`, {
      sessionId
    });
  }

  createPortalSession(returnUrl: string): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${this.apiUrl}/create-portal-session`, {
      returnUrl
    });
  }

  getSubscription(): Observable<{ status: string, currentPeriodStart: number, currentPeriodEnd: number, cancelAtPeriodEnd: boolean }> {
    return this.http.get<{ status: string, currentPeriodStart: number, currentPeriodEnd: number, cancelAtPeriodEnd: boolean }>(`${this.apiUrl}/subscription`);
  }
}
