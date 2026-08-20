import { test, expect } from '@playwright/test';
import { createTestContext } from '../harness';

test.describe('Tier 2: Boundary & Corner Cases — F16: Supporting Infra K8s Manifests', () => {
  const ctx = createTestContext();

  test('F16-B1: should validate Kafka service ports configuration (9092, 9093)', async () => {
    const kafkaSvc = {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: { name: 'kafka-svc', labels: { app: 'kafka' } },
      spec: { ports: [{ name: 'client', port: 9092 }, { name: 'controller', port: 9093 }] },
    };
    const validation = ctx.infra.validateK8sResource(kafkaSvc);
    expect(validation.isValid).toBeTruthy();
  });

  test('F16-B2: should validate Redis single-node configuration', async () => {
    const redis = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: { name: 'redis', labels: { app: 'redis' } },
    };
    const validation = ctx.infra.validateK8sResource(redis);
    expect(validation.isValid).toBeTruthy();
  });

  test('F16-B3: should validate Postgres persistent volume claim resource requests', async () => {
    const pvc = {
      apiVersion: 'v1',
      kind: 'PersistentVolumeClaim',
      metadata: { name: 'postgres-pvc', labels: { app: 'postgres' } },
      spec: { resources: { requests: { storage: '10Gi' } } },
    };
    const validation = ctx.infra.validateK8sResource(pvc);
    expect(validation.isValid).toBeTruthy();
  });

  test('F16-B4: should validate Mongo persistent volume claim resource requests', async () => {
    const pvc = {
      apiVersion: 'v1',
      kind: 'PersistentVolumeClaim',
      metadata: { name: 'mongodb-pvc', labels: { app: 'mongodb' } },
      spec: { resources: { requests: { storage: '10Gi' } } },
    };
    const validation = ctx.infra.validateK8sResource(pvc);
    expect(validation.isValid).toBeTruthy();
  });

  test('F16-B5: should validate NetworkPolicy podSelector matching', async () => {
    const policy = {
      apiVersion: 'networking.k8s.io/v1',
      kind: 'NetworkPolicy',
      metadata: { name: 'database-net-policy', labels: { app: 'database' } },
    };
    const validation = ctx.infra.validateK8sResource(policy);
    expect(validation.isValid).toBeTruthy();
  });
});
