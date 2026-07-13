import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SubscriptionData {
  status: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
}

export interface InvoiceData {
  id: string;
  amountPaid: number;
  status: string;
  created: number;
  hostedInvoiceUrl: string;
  invoicePdf: string;
}

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

  getSubscription(): Observable<SubscriptionData> {
    return this.http.get<SubscriptionData>(`${this.apiUrl}/subscription`);
  }

  getInvoices(): Observable<InvoiceData[]> {
    return this.http.get<InvoiceData[]>(`${this.apiUrl}/invoices`);
  }
}
