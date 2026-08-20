/**
 * Native Federation Micro-Frontend Emulator & Runtime Harness
 * Verifies dynamic module loading, remote manifest resolution, shared singletons, and error boundaries.
 */

import { RemoteModuleDescriptor, FederationManifest } from './test-types';

export interface RemoteLoadResult {
  remoteName: string;
  moduleName: string;
  loaded: boolean;
  exportedRoutesCount: number;
  sharedPackagesUsed: string[];
  loadTimeMs: number;
  fallbackTriggered: boolean;
}

export class NativeFederationHarness {
  private manifest: FederationManifest = {
    'users-mfe': 'http://localhost:4201/remoteEntry.json',
    'tickets-mfe': 'http://localhost:4202/remoteEntry.json',
    'documents-mfe': 'http://localhost:4203/remoteEntry.json',
    'payments-mfe': 'http://localhost:4204/remoteEntry.json',
    'chat-mfe': 'http://localhost:4205/remoteEntry.json',
    'ai-assistant-mfe': 'http://localhost:4206/remoteEntry.json',
  };

  private registeredRemotes: Map<string, RemoteModuleDescriptor> = new Map();
  private sharedSingletons: Set<string> = new Set([
    '@angular/core',
    '@angular/common',
    '@angular/common/http',
    '@angular/router',
    '@angular/forms',
    'rxjs',
    '@ng-console/shared/models',
    '@ng-console/shared/data-access',
    '@ng-console/shared/ui',
    '@ng-console/shared/layout',
    '@ng-console/shared/util',
  ]);

  constructor() {
    this.initializeDefaultRemotes();
  }

  private initializeDefaultRemotes(): void {
    const remotes = ['users-mfe', 'tickets-mfe', 'documents-mfe', 'payments-mfe', 'chat-mfe', 'ai-assistant-mfe'];
    for (const remote of remotes) {
      this.registeredRemotes.set(remote, {
        remoteName: remote,
        exposedModule: './Routes',
        remoteEntryUrl: this.manifest[remote] || '',
        status: 'ONLINE',
        loadedSingletons: Array.from(this.sharedSingletons),
      });
    }
  }

  getManifest(): FederationManifest {
    return { ...this.manifest };
  }

  getSharedSingletons(): string[] {
    return Array.from(this.sharedSingletons);
  }

  isSharedSingleton(pkg: string): boolean {
    return this.sharedSingletons.has(pkg);
  }

  setRemoteStatus(remoteName: string, status: 'ONLINE' | 'OFFLINE' | 'DEGRADED'): void {
    const descriptor = this.registeredRemotes.get(remoteName);
    if (descriptor) {
      descriptor.status = status;
    }
  }

  async loadRemoteModule(remoteName: string, exposedModule = './Routes'): Promise<RemoteLoadResult> {
    const start = Date.now();
    const descriptor = this.registeredRemotes.get(remoteName);

    if (!descriptor || descriptor.status === 'OFFLINE') {
      return {
        remoteName,
        moduleName: exposedModule,
        loaded: false,
        exportedRoutesCount: 0,
        sharedPackagesUsed: [],
        loadTimeMs: Date.now() - start,
        fallbackTriggered: true,
      };
    }

    // Simulate dynamic ESM import map resolution
    const routeCounts: Record<string, number> = {
      'users-mfe': 4,
      'tickets-mfe': 5,
      'documents-mfe': 3,
      'payments-mfe': 4,
      'chat-mfe': 2,
      'ai-assistant-mfe': 3,
    };

    return {
      remoteName,
      moduleName: exposedModule,
      loaded: true,
      exportedRoutesCount: routeCounts[remoteName] || 2,
      sharedPackagesUsed: descriptor.loadedSingletons,
      loadTimeMs: Date.now() - start,
      fallbackTriggered: false,
    };
  }

  verifySingleSingletonInstance(pkg: string, instances: unknown[]): boolean {
    if (!this.sharedSingletons.has(pkg)) return false;
    // Check all instances reference the identical singleton reference
    return instances.length > 0 && instances.every((inst) => inst === instances[0]);
  }
}
