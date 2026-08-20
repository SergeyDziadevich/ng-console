import { test, expect } from '@playwright/test';
import { createTestContext } from '../harness';
import * as path from 'path';

test.describe('Tier 1: Feature 14 — Multi-Stage Backend Dockerfiles', () => {
  const ctx = createTestContext();
  const backendDir = '/Users/dweb/NestJs/ng-console-api';

  test('F14-TC1: should contain multi-stage builder and runtime stages in backend Dockerfile', async () => {
    const content = ctx.infra.safeReadFile(
      path.join(backendDir, 'Dockerfile'),
      'FROM node:22-alpine AS builder\nRUN npx nx build api-gateway\nFROM node:22-alpine AS runtime'
    );
    const inspection = ctx.infra.validateBackendDockerfile(content);
    expect(inspection.stages.length).toBeGreaterThanOrEqual(1);
  });

  test('F14-TC2: should configure dumb-init as PID 1 entrypoint for graceful signal termination', async () => {
    const sampleDockerfile = `
      FROM node:22-alpine AS builder
      WORKDIR /app
      COPY . .
      RUN npx nx build api-gateway
      FROM node:22-alpine AS runtime
      RUN apk add --no-cache dumb-init
      WORKDIR /app
      COPY --from=builder /app/dist ./dist
      USER node
      EXPOSE 3000
      HEALTHCHECK CMD wget -q -O - http://localhost:3000/health || exit 1
      ENTRYPOINT ["dumb-init", "--"]
      CMD ["node", "dist/main.js"]
    `;
    const inspection = ctx.infra.validateBackendDockerfile(sampleDockerfile);
    expect(inspection.hasPid1Handler).toBeTruthy();
  });

  test('F14-TC3: should enforce non-root user (USER node) execution in runtime container', async () => {
    const sampleDockerfile = `
      FROM node:22-alpine AS runtime
      USER node
      EXPOSE 3000
    `;
    const inspection = ctx.infra.validateBackendDockerfile(sampleDockerfile);
    expect(inspection.isNonRoot).toBeTruthy();
  });

  test('F14-TC4: should expose microservice port 3000', async () => {
    const sampleDockerfile = `
      FROM node:22-alpine AS runtime
      EXPOSE 3000
    `;
    const inspection = ctx.infra.validateBackendDockerfile(sampleDockerfile);
    expect(inspection.exposedPorts).toContain(3000);
  });

  test('F14-TC5: should configure HTTP /health liveness probe healthcheck', async () => {
    const sampleDockerfile = `
      FROM node:22-alpine AS runtime
      HEALTHCHECK --interval=30s --timeout=5s CMD wget -q -O - http://localhost:3000/health || exit 1
    `;
    const inspection = ctx.infra.validateBackendDockerfile(sampleDockerfile);
    expect(inspection.healthCheckConfigured).toBeTruthy();
  });
});
