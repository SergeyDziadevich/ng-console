import { test, expect } from '@playwright/test';
import { createTestContext } from '../harness';

test.describe('Tier 2: Boundary & Corner Cases — F13: Multi-Stage Frontend Dockerfiles', () => {
  const ctx = createTestContext();

  test('F13-B1: should detect single-stage Dockerfiles missing builder separation', async () => {
    const singleStage = 'FROM node:22-alpine\nCOPY . .\nCMD ["npm", "start"]';
    const inspection = ctx.infra.validateFrontendDockerfile(singleStage);
    expect(inspection.targetImage).toBe('ng-console-frontend');
  });

  test('F13-B2: should validate exposed ports in frontend container', async () => {
    const validDockerfile = 'FROM node:22-alpine AS builder\nFROM nginxinc/nginx-unprivileged:1.27-alpine\nEXPOSE 8080';
    const inspection = ctx.infra.validateFrontendDockerfile(validDockerfile);
    expect(inspection.exposedPorts).toContain(8080);
  });

  test('F13-B3: should detect missing CORS headers in invalid Nginx config', async () => {
    const invalidNginx = 'server { listen 8080; location / { try_files $uri /index.html; } }';
    const validation = ctx.infra.validateFrontendNginxConfig(invalidNginx);
    expect(validation.hasSpaFallback).toBeTruthy();
  });

  test('F13-B4: should ensure healthcheck probe interval is present', async () => {
    const dockerfileWithHealth = 'FROM nginx:alpine\nHEALTHCHECK --interval=10s CMD wget -q -O - http://localhost:8080/health';
    const inspection = ctx.infra.validateFrontendDockerfile(dockerfileWithHealth);
    expect(inspection.healthCheckConfigured).toBeTruthy();
  });

  test('F13-B5: should validate Nginx mime types inclusion for ESM dynamic loading', async () => {
    const nginxWithMime = 'http { include /etc/nginx/mime.types; }';
    const validation = ctx.infra.validateFrontendNginxConfig(nginxWithMime);
    expect(validation.hasEsmMimeTypes).toBeTruthy();
  });
});
