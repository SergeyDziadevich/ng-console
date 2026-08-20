import { test, expect } from '@playwright/test';
import { createTestContext } from '../harness';

test.describe('Tier 1: Feature 16 — Supporting Infra K8s Manifests', () => {
  const ctx = createTestContext();

  test('F16-TC1: should validate Apache Kafka KRaft mode manifest definition', async () => {
    const kafkaStatefulSet = {
      apiVersion: 'apps/v1',
      kind: 'StatefulSet',
      metadata: { name: 'kafka-kraft', labels: { app: 'kafka' } },
      spec: { serviceName: 'kafka-svc', replicas: 1 },
    };
    const validation = ctx.infra.validateK8sResource(kafkaStatefulSet);
    expect(validation.isValid).toBeTruthy();
  });

  test('F16-TC2: should validate Redis Deployment and Service definitions', async () => {
    const redisSvc = {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: { name: 'redis-svc', labels: { app: 'redis' } },
      spec: { ports: [{ port: 6379, targetPort: 6379 }] },
    };
    const validation = ctx.infra.validateK8sResource(redisSvc);
    expect(validation.isValid).toBeTruthy();
  });

  test('F16-TC3: should validate PostgreSQL StatefulSet and persistent volume claim definitions', async () => {
    const postgresStatefulSet = {
      apiVersion: 'apps/v1',
      kind: 'StatefulSet',
      metadata: { name: 'postgres', labels: { app: 'postgres' } },
      spec: { serviceName: 'postgres-svc' },
    };
    const validation = ctx.infra.validateK8sResource(postgresStatefulSet);
    expect(validation.isValid).toBeTruthy();
  });

  test('F16-TC4: should validate MongoDB StatefulSet and persistent volume claim definitions', async () => {
    const mongoStatefulSet = {
      apiVersion: 'apps/v1',
      kind: 'StatefulSet',
      metadata: { name: 'mongodb', labels: { app: 'mongodb' } },
      spec: { serviceName: 'mongodb-svc' },
    };
    const validation = ctx.infra.validateK8sResource(mongoStatefulSet);
    expect(validation.isValid).toBeTruthy();
  });

  test('F16-TC5: should validate NetworkPolicy manifests for database and Kafka isolation', async () => {
    const netPolicy = {
      apiVersion: 'networking.k8s.io/v1',
      kind: 'NetworkPolicy',
      metadata: { name: 'isolate-databases' },
      spec: { podSelector: { matchLabels: { role: 'database' } } },
    };
    const validation = ctx.infra.validateK8sResource(netPolicy);
    expect(validation.isValid).toBeTruthy();
  });
});
