import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SubscriptionsComponent } from './subscriptions.component';
import { PaymentsService } from '../../services/payments.service';
import { AuthService } from '../../services/auth.service';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

describe('SubscriptionsComponent', () => {
  let component: SubscriptionsComponent;
  let fixture: ComponentFixture<SubscriptionsComponent>;
  let paymentsServiceMock: Record<string, ReturnType<typeof vi.fn>>;
  let authServiceMock: Record<string, any>;

  const mockUserSignal = signal<{ planId: string | null } | null>(null);

  beforeEach(async () => {
    paymentsServiceMock = {
      getSubscription: vi.fn().mockReturnValue(of(null)),
      createCheckoutSession: vi.fn(),
      createPortalSession: vi.fn()
    };
    
    authServiceMock = {
      currentUser: mockUserSignal
    };

    await TestBed.configureTestingModule({
      imports: [SubscriptionsComponent],
      providers: [
        { provide: PaymentsService, useValue: paymentsServiceMock },
        { provide: AuthService, useValue: authServiceMock }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    mockUserSignal.set(null);
  });

  it('should create', () => {
    fixture = TestBed.createComponent(SubscriptionsComponent);
    component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should load subscription details if user has active plan', async () => {
    mockUserSignal.set({ planId: 'price_1Tsh1w3C6FGO2xjMcR62X9Po' });
    const mockDetails = { status: 'active', currentPeriodStart: 123, currentPeriodEnd: 456, cancelAtPeriodEnd: false };
    paymentsServiceMock['getSubscription'].mockReturnValue(of(mockDetails));

    fixture = TestBed.createComponent(SubscriptionsComponent);
    component = fixture.componentInstance;
    
    fixture.detectChanges();
    await fixture.whenStable();

    expect(paymentsServiceMock['getSubscription']).toHaveBeenCalled();
    expect((component as unknown as { subscriptionDetails: () => unknown }).subscriptionDetails()).toEqual(mockDetails);
  });

  it('should not load subscription details if user has no active plan', async () => {
    mockUserSignal.set({ planId: null });
    
    fixture = TestBed.createComponent(SubscriptionsComponent);
    component = fixture.componentInstance;
    
    fixture.detectChanges();
    await fixture.whenStable();

    expect(paymentsServiceMock['getSubscription']).not.toHaveBeenCalled();
    expect((component as unknown as { subscriptionDetails: () => unknown }).subscriptionDetails()).toBeNull();
  });

  it('getCurrentPlan should return correct plan based on activePlan', () => {
    fixture = TestBed.createComponent(SubscriptionsComponent);
    component = fixture.componentInstance;

    mockUserSignal.set({ planId: 'prod_Uslsp82BoehihT' });
    fixture.detectChanges();

    const plan = component.currentPlan();
    expect(plan?.name).toBe('Premium');
  });

  it('getCurrentPlan should return null if no planId', () => {
    fixture = TestBed.createComponent(SubscriptionsComponent);
    component = fixture.componentInstance;

    mockUserSignal.set({ planId: null });
    fixture.detectChanges();

    const plan = component.currentPlan();
    expect(plan).toBeNull();
  });

  it('upgrade should call createCheckoutSession and redirect', () => {
    fixture = TestBed.createComponent(SubscriptionsComponent);
    component = fixture.componentInstance;

    const mockUrl = 'http://checkout.url';
    paymentsServiceMock['createCheckoutSession'].mockReturnValue(of({ url: mockUrl }));
    
    component.upgrade('test_price_id');

    expect(component['processingAction']()).toBe('test_price_id');
    expect(paymentsServiceMock['createCheckoutSession']).toHaveBeenCalledWith(
      'test_price_id',
      expect.any(String),
      expect.any(String)
    );
  });

  it('upgrade should handle error correctly', () => {
    fixture = TestBed.createComponent(SubscriptionsComponent);
    component = fixture.componentInstance;

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    paymentsServiceMock['createCheckoutSession'].mockReturnValue(throwError(() => new Error('test error')));
    
    component.upgrade('test_price_id');

    expect(consoleSpy).toHaveBeenCalledWith('Failed to create checkout session', expect.any(Error));
    expect(component['processingAction']()).toBeNull();
  });

  it('manageBilling should call createPortalSession and open new tab', () => {
    fixture = TestBed.createComponent(SubscriptionsComponent);
    component = fixture.componentInstance;

    const mockUrl = 'http://portal.url';
    paymentsServiceMock['createPortalSession'].mockReturnValue(of({ url: mockUrl }));
    const windowSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    component.manageBilling();

    expect(paymentsServiceMock['createPortalSession']).toHaveBeenCalledWith(expect.any(String));
    expect(windowSpy).toHaveBeenCalledWith(mockUrl, '_blank');
    expect(component['processingAction']()).toBeNull();
  });

  it('manageBilling should handle error correctly', () => {
    fixture = TestBed.createComponent(SubscriptionsComponent);
    component = fixture.componentInstance;

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    paymentsServiceMock['createPortalSession'].mockReturnValue(throwError(() => new Error('test error')));
    
    component.manageBilling();

    expect(consoleSpy).toHaveBeenCalledWith('Failed to create portal session', expect.any(Error));
    expect(component['processingAction']()).toBeNull();
  });
});
