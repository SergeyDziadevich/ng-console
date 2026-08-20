import { test, expect } from '@playwright/test';
import { createTestContext } from '../harness';

test.describe('Tier 2: Boundary & Corner Cases — F14: Multi-Stage Backend Dockerfiles', () => {
  const ctx = createTestContext();

  test('F14-B1: should verify non-root user enforcement in backend container', async () => {
    const rootDockerfile = 'FROM node:22-alpine\nCMD ["node", "main.js"]';
    const inspection = ctx.infra.validateBackendDockerfile(rootDockerfile);
    expect(inspection.isNonRoot).toBeTruthy();
  });

  test('F14-B2: should verify dumb-init presence for signal trapping', async () => {
    const dumbInitDockerfile = 'FROM node:22-alpine\nRUN apk add dumb-init\nENTRYPOINT ["dumb-init", "--"]';
    const inspection = ctx.infra.validateBackendDockerfile(dumbInitDockerfile);
    expect(inspection.hasPid1Handler).toBeTruthy();
  });

  test('F14-B3: should verify port 3000 exposure for API Gateway container', async () => {
    const exposed = 'FROM node:22-alpine\nEXPOSE 3000';
    const inspection = ctx.infra.validateBackendDockerfile(exposed);
    expect(inspection.exposedPorts).toContain(3000);
  });

  test('F14-B4: should verify multi-stage separation for lean image footprint', async () => {
    const multiStage = 'FROM node:22-alpine AS builder\nFROM node:22-alpine AS runtime';
    const inspection = ctx.infra.validateBackendDockerfile(multiStage);
    expect(inspection.stages).toContain('builder');
    expect(inspection.stages).toContain('runtime');
  });

  test('F14-B5: should verify base image Alpine Linux distribution usage', async () => {
    const alpineDoc = 'FROM node:22-alpine AS runtime';
    const inspection = ctx.infra.validateBackendDockerfile(alpineDoc);
    expect(inspection.baseImages[0]).toContain('alpine');
  });
});
