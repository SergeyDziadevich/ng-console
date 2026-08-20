/**
 * Unified Test Context & Harness Factory
 * Exposes instantiated test harnesses and fixtures for Tier 1-4 suites.
 */

import { ApiClientHarness } from './api-client';
import { RpcTransportHarness } from './rpc-harness';
import { KafkaEventHarness } from './kafka-harness';
import { NativeFederationHarness } from './mfe-harness';
import { InfraValidatorHarness } from './infra-validator';

export class TestContext {
  readonly api: ApiClientHarness;
  readonly rpc: RpcTransportHarness;
  readonly kafka: KafkaEventHarness;
  readonly mfe: NativeFederationHarness;
  readonly infra: InfraValidatorHarness;

  constructor() {
    this.api = new ApiClientHarness();
    this.rpc = new RpcTransportHarness();
    this.kafka = new KafkaEventHarness();
    this.mfe = new NativeFederationHarness();
    this.infra = new InfraValidatorHarness();
  }

  resetAll(): void {
    this.api.clearAuthToken();
    this.kafka.reset();
  }
}

export function createTestContext(): TestContext {
  return new TestContext();
}
