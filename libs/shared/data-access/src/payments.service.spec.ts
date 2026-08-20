import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PaymentsService } from './payments.service';
import { environment } from "@env/environment";

describe('PaymentsService', () => {
  let service: PaymentsService;
  let httpTestingController: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/api/payments`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PaymentsService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });
    service = TestBed.inject(PaymentsService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create a checkout session', () => {
    const mockResponse = { url: 'https://checkout.stripe.com/pay' };
    const priceId = 'price_123';
    const successUrl = 'http://localhost/success';
    const cancelUrl = 'http://localhost/cancel';

    service.createCheckoutSession(priceId, successUrl, cancelUrl).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTestingController.expectOne(`${apiUrl}/create-checkout-session`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ priceId, successUrl, cancelUrl });
    req.flush(mockResponse);
  });

  it('should verify a session', () => {
    const mockResponse = { access_token: 'new-jwt-token' };
    const sessionId = 'cs_test_123';

    service.verifySession(sessionId).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTestingController.expectOne(`${apiUrl}/verify-session`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ sessionId });
    req.flush(mockResponse);
  });

  it('should create a portal session', () => {
    const mockResponse = { url: 'https://billing.stripe.com/p/session' };
    const returnUrl = 'http://localhost/payments/subscriptions';

    service.createPortalSession(returnUrl).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTestingController.expectOne(`${apiUrl}/create-portal-session`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ returnUrl });
    req.flush(mockResponse);
  });

  it('should get subscription details', () => {
    const mockResponse = {
      status: 'active',
      currentPeriodStart: 1234567890,
      currentPeriodEnd: 1234567890,
      cancelAtPeriodEnd: false
    };

    service.getSubscription().subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTestingController.expectOne(`${apiUrl}/subscription`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});
