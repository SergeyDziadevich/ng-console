import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { featureFlagGuard } from './feature-flag.guard';
import { FeatureFlagService } from '../services/feature-flag.service';

describe('featureFlagGuard', () => {
  let mockFeatureFlagService: { isEnabled: Mock };
  let mockRouter: { createUrlTree: Mock };

  beforeEach(() => {
    mockFeatureFlagService = {
      isEnabled: vi.fn(),
    };

    mockRouter = {
      createUrlTree: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: FeatureFlagService, useValue: mockFeatureFlagService },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  it('should allow navigation if feature flag is enabled', () => {
    mockFeatureFlagService.isEnabled.mockReturnValue(true);

    const guard = featureFlagGuard('newDashboard');
    const result = TestBed.runInInjectionContext(() => guard({} as never, {} as never));

    expect(mockFeatureFlagService.isEnabled).toHaveBeenCalledWith('newDashboard');
    expect(result).toBe(true);
  });

  it('should redirect to default fallback route ("/") if feature flag is disabled', () => {
    mockFeatureFlagService.isEnabled.mockReturnValue(false);
    mockRouter.createUrlTree.mockReturnValue('mockUrlTree' as never);

    const guard = featureFlagGuard('newDashboard');
    const result = TestBed.runInInjectionContext(() => guard({} as never, {} as never));

    expect(mockFeatureFlagService.isEnabled).toHaveBeenCalledWith('newDashboard');
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/']);
    expect(result).toBe('mockUrlTree');
  });

  it('should redirect to custom fallback URL if provided', () => {
    mockFeatureFlagService.isEnabled.mockReturnValue(false);
    mockRouter.createUrlTree.mockReturnValue('customUrlTree' as never);

    const guard = featureFlagGuard('experimentalFeature', '/404');
    const result = TestBed.runInInjectionContext(() => guard({} as never, {} as never));

    expect(mockFeatureFlagService.isEnabled).toHaveBeenCalledWith('experimentalFeature');
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/404']);
    expect(result).toBe('customUrlTree');
  });
});
