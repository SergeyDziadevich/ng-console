import { Injectable, inject, isDevMode, signal, computed, Signal, InjectionToken, DestroyRef, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type FeatureFlagMap = Record<string, boolean>;

export const IS_DEV_MODE = new InjectionToken<() => boolean>('IS_DEV_MODE', {
  providedIn: 'root',
  factory: () => isDevMode,
});

const LOCAL_STORAGE_OVERRIDE_KEY = 'ff_overrides';
const DEFAULT_CONFIG_URL = '/assets/config/feature-flags.json';

@Injectable({
  providedIn: 'root',
})
export class FeatureFlagService {
  private readonly http = inject(HttpClient);
  private readonly isDevModeFn = inject(IS_DEV_MODE);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  /** Raw flags loaded from configuration file */
  private readonly configFlagsSignal = signal<FeatureFlagMap>({});
  readonly configFlags = this.configFlagsSignal.asReadonly();

  /** Local storage overrides (only active in dev mode) */
  private readonly overridesSignal = signal<FeatureFlagMap>(this.loadOverridesFromStorage());
  readonly overrides = this.overridesSignal.asReadonly();

  /** Indicates whether feature flags have completed loading */
  private readonly isLoadedSignal = signal<boolean>(false);
  readonly isLoaded = this.isLoadedSignal.asReadonly();

  /**
   * Effective flags map.
   * In dev mode: local storage overrides take priority over config flags.
   * In prod mode: local storage overrides are ignored.
   */
  readonly flags = computed<FeatureFlagMap>(() => {
    const config = this.configFlagsSignal();
    if (this.isDevModeFn()) {
      return { ...config, ...this.overridesSignal() };
    }
    return config;
  });

  constructor() {
    // Sync with localStorage changes across windows/tabs in dev mode
    if (this.isDevModeFn() && isPlatformBrowser(this.platformId)) {
      const handleStorageChange = (event: StorageEvent) => {
        if (event.key === LOCAL_STORAGE_OVERRIDE_KEY) {
          this.overridesSignal.set(this.loadOverridesFromStorage());
        }
      };

      window.addEventListener('storage', handleStorageChange);
      this.destroyRef.onDestroy(() => {
        window.removeEventListener('storage', handleStorageChange);
      });
    }
  }

  /**
   * Fetches feature flags configuration from JSON asset.
   */
  async loadFlags(configUrl: string = DEFAULT_CONFIG_URL): Promise<void> {
    try {
      const data = await firstValueFrom(this.http.get<FeatureFlagMap>(configUrl));
      if (data && typeof data === 'object') {
        this.configFlagsSignal.set(data);
      }
    } catch (error) {
      console.warn(`[FeatureFlagService] Failed to load feature flags from ${configUrl}`, error);
    } finally {
      this.isLoadedSignal.set(true);
    }
  }

  /**
   * Returns whether a given feature flag is enabled.
   * Default fallback is false if flag is not defined.
   */
  isEnabled(flagKey: string, defaultValue = false): boolean {
    const currentFlags = this.flags();
    return flagKey in currentFlags ? currentFlags[flagKey] : defaultValue;
  }

  /**
   * Returns a reactive computed signal for a specific feature flag.
   */
  getFlagSignal(flagKey: string, defaultValue = false): Signal<boolean> {
    return computed(() => {
      const currentFlags = this.flags();
      return flagKey in currentFlags ? currentFlags[flagKey] : defaultValue;
    });
  }

  /**
   * Overwrites feature flag setting in localStorage (Dev Mode only).
   */
  setOverride(flagKey: string, enabled: boolean): void {
    if (!this.isDevModeFn()) {
      console.warn('[FeatureFlagService] Overriding feature flags in local storage is only supported in dev mode.');
      return;
    }
    const currentOverrides = { ...this.overridesSignal(), [flagKey]: enabled };
    this.saveOverridesToStorage(currentOverrides);
    this.overridesSignal.set(currentOverrides);
  }

  /**
   * Removes a specific feature flag override from localStorage (Dev Mode only).
   */
  removeOverride(flagKey: string): void {
    if (!this.isDevModeFn()) {
      return;
    }
    const currentOverrides = { ...this.overridesSignal() };
    delete currentOverrides[flagKey];
    this.saveOverridesToStorage(currentOverrides);
    this.overridesSignal.set(currentOverrides);
  }

  /**
   * Clears all feature flag overrides from localStorage (Dev Mode only).
   */
  clearOverrides(): void {
    if (!this.isDevModeFn()) {
      return;
    }
    this.saveOverridesToStorage({});
    this.overridesSignal.set({});
  }

  /**
   * Retrieves current local storage overrides.
   */
  getOverrides(): FeatureFlagMap {
    return this.overridesSignal();
  }

  private loadOverridesFromStorage(): FeatureFlagMap {
    if (typeof localStorage === 'undefined') {
      return {};
    }
    try {
      const item = localStorage.getItem(LOCAL_STORAGE_OVERRIDE_KEY);
      return item ? JSON.parse(item) : {};
    } catch {
      return {};
    }
  }

  private saveOverridesToStorage(overrides: FeatureFlagMap): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    try {
      if (Object.keys(overrides).length === 0) {
        localStorage.removeItem(LOCAL_STORAGE_OVERRIDE_KEY);
      } else {
        localStorage.setItem(LOCAL_STORAGE_OVERRIDE_KEY, JSON.stringify(overrides));
      }
    } catch (error) {
      console.warn('[FeatureFlagService] Failed to save overrides to local storage', error);
    }
  }
}

