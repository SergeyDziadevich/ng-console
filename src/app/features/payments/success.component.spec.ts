import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaymentSuccessComponent } from './success.component';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { PaymentsService } from '../../services/payments.service';
import { AuthService } from '../../services/auth.service';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

class MockAuthService {
  currentUser = signal<{ id: string, name: string, email: string, role: string, planId?: string } | null>(null);
  decodeToken(token: string | null) {
    if (!token) return null;
    return {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      planId: 'plan_123'
    };
  }
}

describe('PaymentSuccessComponent', () => {
  let component: PaymentSuccessComponent;
  let fixture: ComponentFixture<PaymentSuccessComponent>;
  let mockPaymentsService: { verifySession: ReturnType<typeof vi.fn> };
  let mockAuthService: MockAuthService;

  beforeEach(async () => {
    mockPaymentsService = { verifySession: vi.fn() };
    mockAuthService = new MockAuthService();

    await TestBed.configureTestingModule({
      imports: [PaymentSuccessComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({ session_id: 'test_session_123' })
            }
          }
        },
        { provide: PaymentsService, useValue: mockPaymentsService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.removeItem('auth_token');
  });

  it('should verify session and update token on init', () => {
    const mockResponse = { access_token: 'new-mock-token' };
    mockPaymentsService.verifySession.mockReturnValue(of(mockResponse));

    fixture = TestBed.createComponent(PaymentSuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // triggers ngOnInit

    expect(mockPaymentsService.verifySession).toHaveBeenCalledWith('test_session_123');
    expect(localStorage.getItem('auth_token')).toBe('new-mock-token');
    expect(mockAuthService.currentUser()).toEqual({
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      planId: 'plan_123'
    });
    expect(component['isVerifying']()).toBe(false);
  });

  it('should handle verification error', () => {
    mockPaymentsService.verifySession.mockReturnValue(throwError(() => new Error('Verification failed')));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    fixture = TestBed.createComponent(PaymentSuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // triggers ngOnInit

    expect(mockPaymentsService.verifySession).toHaveBeenCalledWith('test_session_123');
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(component['isVerifying']()).toBe(false);
    consoleErrorSpy.mockRestore();
  });
});

describe('PaymentSuccessComponent without session_id', () => {
  let component: PaymentSuccessComponent;
  let fixture: ComponentFixture<PaymentSuccessComponent>;
  let mockPaymentsService: { verifySession: ReturnType<typeof vi.fn> };
  let mockAuthService: MockAuthService;

  beforeEach(async () => {
    mockPaymentsService = { verifySession: vi.fn() };
    mockAuthService = new MockAuthService();

    await TestBed.configureTestingModule({
      imports: [PaymentSuccessComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({})
            }
          }
        },
        { provide: PaymentsService, useValue: mockPaymentsService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();
  });

  it('should not verify if no session_id is provided', () => {
    fixture = TestBed.createComponent(PaymentSuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // triggers ngOnInit

    expect(mockPaymentsService.verifySession).not.toHaveBeenCalled();
    expect(component['isVerifying']()).toBe(false);
  });
});
