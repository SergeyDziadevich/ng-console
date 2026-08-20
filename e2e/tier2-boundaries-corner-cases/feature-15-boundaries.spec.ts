import { test, expect } from '@playwright/test';
import { createTestContext } from '../harness';

test.describe('Tier 2: Boundary & Corner Cases — F15: Kubernetes Base & Overlay Manifests', () => {
  const ctx = createTestContext();

  test('F15-B1: should detect invalid K8s resource missing apiVersion', async () => {
    const invalidResource = {
      apiVersion: '',
      kind: 'Deployment',
      metadata: { name: 'test-dep' },
    };
    const validation = ctx.infra.validateK8sResource(invalidResource);
    expect(validation.isValid).toBeFalsy();
    expect(validation.errors).toContain('Missing apiVersion');
  });

  test('F15-B2: should detect invalid K8s resource missing kind', async () => {
    const invalidResource = {
      apiVersion: 'apps/v1',
      kind: '',
      metadata: { name: 'test-dep' },
    };
    const validation = ctx.infra.validateK8sResource(invalidResource);
    expect(validation.isValid).toBeFalsy();
    expect(validation.errors).toContain('Missing kind');
  });

  test('F15-B3: should detect invalid K8s resource missing metadata.name', async () => {
    const invalidResource = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: { name: '' },
    };
    const validation = ctx.infra.validateK8sResource(invalidResource);
    expect(validation.isValid).toBeFalsy();
    expect(validation.errors).toContain('Missing metadata.name');
  });

  test('F15-B4: should validate presence of labels in resource metadata', async () => {
    const labeledResource = {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: { name: 'svc', labels: { 'app.kubernetes.io/name': 'shell' } },
    };
    const validation = ctx.infra.validateK8sResource(labeledResource);
    expect(validation.hasLabels).toBeTruthy();
  });

  test('F15-B5: should validate explicit namespace specification', async () => {
    const namespaced = {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: { name: 'cfg', namespace: 'cloud-console-staging' },
    };
    const validation = ctx.infra.validateK8sResource(namespaced);
    expect(validation.hasNamespace).toBeTruthy();
  });
});
