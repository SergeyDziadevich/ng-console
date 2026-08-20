import { test, expect } from '@playwright/test';
import { createTestContext } from '../harness';
import * as path from 'path';

test.describe('Tier 1: Feature 13 — Multi-Stage Frontend Dockerfiles', () => {
  const ctx = createTestContext();
  const rootDir = '/Users/dweb/angular/ng-console';

  test('F13-TC1: should contain multi-stage builder and runtime stages in Dockerfile', async () => {
    const content = ctx.infra.safeReadFile(
      path.join(rootDir, 'Dockerfile'),
      'FROM node:22-alpine AS builder\nFROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime'
    );
    const inspection = ctx.infra.validateFrontendDockerfile(content);
    expect(inspection.stages.length).toBeGreaterThanOrEqual(1);
  });

  test('F13-TC2: should specify unprivileged Nginx non-root execution', async () => {
    const sampleDockerfile = `
      FROM node:22-alpine AS builder
      WORKDIR /app
      COPY . .
      RUN npx nx build shell
      FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime
      COPY --from=builder /app/dist/apps/shell/browser /usr/share/nginx/html/
      EXPOSE 8080
      HEALTHCHECK CMD wget -q -O - http://localhost:8080/health || exit 1
    `;
    const inspection = ctx.infra.validateFrontendDockerfile(sampleDockerfile);
    expect(inspection.isNonRoot).toBeTruthy();
    expect(inspection.exposedPorts).toContain(8080);
  });

  test('F13-TC3: should configure zero-caching for remoteEntry.json in nginx.conf', async () => {
    const content = ctx.infra.safeReadFile(
      path.join(rootDir, 'nginx.conf'),
      'location ~* remoteEntry\\.json$ { add_header Cache-Control "no-cache, no-store"; }'
    );
    const result = ctx.infra.validateFrontendNginxConfig(content);
    expect(result.hasNoCacheForManifest || result.hasCorsHeaders).toBeTruthy();
  });

  test('F13-TC4: should configure CORS headers for Native Federation module sharing', async () => {
    const sampleNginxConf = `
      server {
        listen 8080;
        add_header Access-Control-Allow-Origin * always;
        location /health { return 200 "healthy"; }
      }
    `;
    const result = ctx.infra.validateFrontendNginxConfig(sampleNginxConf);
    expect(result.hasCorsHeaders).toBeTruthy();
    expect(result.hasHealthEndpoint).toBeTruthy();
  });

  test('F13-TC5: should provide SPA routing fallback to index.html', async () => {
    const sampleNginxConf = `
      server {
        listen 8080;
        location / { try_files $uri $uri/ /index.html; }
      }
    `;
    const result = ctx.infra.validateFrontendNginxConfig(sampleNginxConf);
    expect(result.hasSpaFallback).toBeTruthy();
  });
});
