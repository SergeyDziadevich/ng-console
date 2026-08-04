import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { FeatureFlagService } from '../services/feature-flag.service';

/**
 * Creates a CanActivateFn guard that checks if a specified feature flag is enabled.
 * If disabled, redirects to fallbackUrl (default '/') or returns false.
 */
export const featureFlagGuard = (
  flagKey: string,
  fallbackUrl = '/'
): CanActivateFn => {
  return (): boolean | UrlTree => {
    const featureFlagService = inject(FeatureFlagService);
    const router = inject(Router);

    if (featureFlagService.isEnabled(flagKey)) {
      return true;
    }

    return router.createUrlTree([fallbackUrl]);
  };
};
