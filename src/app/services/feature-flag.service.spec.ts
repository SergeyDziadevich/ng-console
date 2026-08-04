import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FeatureFlagService, FeatureFlagMap, IS_DEV_MODE } from './feature-flag.service';

describe('FeatureFlagService', () => {
  let service: FeatureFlagService;
  let httpMock: HttpTestingController;
  let isDevModeValue = true;

  beforeEach(() => {
    isDevModeValue = true;
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        FeatureFlagService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: IS_DEV_MODE, useValue: () => isDevModeValue },
      ],
    });

    service = TestBed.inject(FeatureFlagService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load feature flags from config JSON file', async () => {
    const mockConfig: FeatureFlagMap = {
      featureUnderConstruction: false,
      newDashboard: true,
    };

    const loadPromise = service.loadFlags('/assets/config/feature-flags.json');

    const req = httpMock.expectOne('/assets/config/feature-flags.json');
    expect(req.request.method).toBe('GET');
    req.flush(mockConfig);

    await loadPromise;

    expect(service.isLoaded()).toBe(true);
    expect(service.isEnabled('newDashboard')).toBe(true);
    expect(service.isEnabled('featureUnderConstruction')).toBe(false);
  });

  it('should return defaultValue if flag is missing', () => {
    expect(service.isEnabled('unknownFlag')).toBe(false);
    expect(service.isEnabled('unknownFlag', true)).toBe(true);
  });

  describe('in development mode (isDevMode() = true)', () => {
    beforeEach(() => {
      isDevModeValue = true;
    });

    it('should prioritize local storage overrides over config file values', async () => {
      const mockConfig: FeatureFlagMap = {
        featureUnderConstruction: false,
        newDashboard: true,
      };

      // Set local storage override prior to loading config
      localStorage.setItem('ff_overrides', JSON.stringify({ featureUnderConstruction: true }));

      // Create a fresh instance of service in injection context
      const freshService = TestBed.runInInjectionContext(() => new FeatureFlagService());

      const loadPromise = freshService.loadFlags('/assets/config/feature-flags.json');
      const req = httpMock.expectOne('/assets/config/feature-flags.json');
      req.flush(mockConfig);
      await loadPromise;

      // featureUnderConstruction was false in config, but override is true
      expect(freshService.isEnabled('featureUnderConstruction')).toBe(true);
      expect(freshService.isEnabled('newDashboard')).toBe(true);
    });

    it('should allow setting, removing, and clearing overrides dynamically', () => {
      service.setOverride('featureUnderConstruction', true);
      expect(service.isEnabled('featureUnderConstruction')).toBe(true);
      expect(JSON.parse(localStorage.getItem('ff_overrides') || '{}')).toEqual({
        featureUnderConstruction: true,
      });

      service.removeOverride('featureUnderConstruction');
      expect(service.isEnabled('featureUnderConstruction')).toBe(false);
      expect(localStorage.getItem('ff_overrides')).toBeNull();

      service.setOverride('flagA', true);
      service.setOverride('flagB', false);
      expect(service.getOverrides()).toEqual({ flagA: true, flagB: false });

      service.clearOverrides();
      expect(service.getOverrides()).toEqual({});
      expect(localStorage.getItem('ff_overrides')).toBeNull();
    });

    it('should reactively update flag signal when override changes', () => {
      const flagSignal = service.getFlagSignal('experimentalFeature', false);
      expect(flagSignal()).toBe(false);

      service.setOverride('experimentalFeature', true);
      expect(flagSignal()).toBe(true);
    });
  });

  describe('in production mode (isDevMode() = false)', () => {
    beforeEach(() => {
      isDevModeValue = false;
    });

    it('should ignore local storage overrides in production mode', async () => {
      const mockConfig: FeatureFlagMap = {
        featureUnderConstruction: false,
      };

      // Populate localStorage
      localStorage.setItem('ff_overrides', JSON.stringify({ featureUnderConstruction: true }));

      const freshService = TestBed.runInInjectionContext(() => new FeatureFlagService());

      const loadPromise = freshService.loadFlags('/assets/config/feature-flags.json');
      const req = httpMock.expectOne('/assets/config/feature-flags.json');
      req.flush(mockConfig);
      await loadPromise;

      // Local storage override must be ignored in production mode
      expect(freshService.isEnabled('featureUnderConstruction')).toBe(false);
    });

    it('should prevent setting overrides in production mode', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      const freshService = TestBed.runInInjectionContext(() => new FeatureFlagService());
      freshService.setOverride('featureUnderConstruction', true);

      expect(warnSpy).toHaveBeenCalled();
      expect(freshService.isEnabled('featureUnderConstruction')).toBe(false);
      expect(localStorage.getItem('ff_overrides')).toBeNull();
    });
  });

});
