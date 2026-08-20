# Cloud Console E2E Test Infrastructure & Test Harness Architecture

## 1. Overview & Architectural Principles

The Cloud Console Dual Monorepo E2E Test Suite provides end-to-end opaque-box verification across the entire platform ecosystem:
- **Frontend Workspace**: Angular 22 Native Federation Host Shell (`apps/shell`), 6 remote Micro-Frontends (`users-mfe`, `tickets-mfe`, `documents-mfe`, `payments-mfe`, `chat-mfe`, `ai-assistant-mfe`), and 5 shared libraries (`@ng-console/shared/*`).
- **Backend Workspace**: NestJS API Gateway (`apps/api-gateway`), 11 decoupled domain microservices, synchronous RPC transports (TCP/Redis), and asynchronous Kafka event streaming.
- **Supporting Infrastructure**: Production unprivileged Dockerfiles, Kubernetes Kustomize manifests (`k8s/base`, `k8s/overlays/local`, `k8s/overlays/staging`), Kafka KRaft, Redis, PostgreSQL, and MongoDB.

### Core Testing Pillars:
1. **Opaque-Box & Requirement-Driven**: Tests assert observable external behavior, contract adherence, event emission, and user workflows rather than internal implementation details.
2. **Zero `any` Policy**: Strict TypeScript typing across all tests, assertion utilities, data fixtures, and mocks (`noImplicitAny: true`, strict typing).
3. **Deterministic & Isolated**: Each test case initializes its own test context and state, without coupling to execution order or external environmental flake.
4. **4-Tier Testing Hierarchy**: Systematic structure spanning unit feature equivalence, boundary limit stress, cross-feature pairwise integrations, and multi-step real-world customer journeys.

---

## 2. Systematic 4-Tier Testing Hierarchy

```
+-------------------------------------------------------------------------+
| Tier 4: Real-World Scenarios (Multi-Step Production Workflows)          |
| 5 Workflow Specs | 25 Tests | Onboarding, Incident Triage, Checkout, RAG|
+-------------------------------------------------------------------------+
                                    ▲
                                    │
+-------------------------------------------------------------------------+
| Tier 3: Cross-Feature Combinations (Pairwise Microservice Integrations) |
| 6 Integration Specs | 30 Tests | Auth+User, Ticket+Audit, Chat+Redis     |
+-------------------------------------------------------------------------+
                                    ▲
                                    │
+-------------------------------------------------------------------------+
| Tier 2: Boundary & Corner Cases (Limits, Overflow, Malformed Data)      |
| 20 Feature Specs | 100 Tests | >=5 Boundary Tests per Feature           |
+-------------------------------------------------------------------------+
                                    ▲
                                    │
+-------------------------------------------------------------------------+
| Tier 1: Feature Coverage (Equivalence Class Representatives)            |
| 20 Feature Specs | 107 Tests | All 20 Inventory Features Covered        |
+-------------------------------------------------------------------------+
```

### Tier Breakdown
- **Tier 1: Feature Coverage** (`e2e/tier1-feature-coverage/`):
  - 20 spec files mapping 1:1 to all 20 features in `PROJECT.md § Feature Inventory`.
  - >=5 tests per feature (107 total test cases) verifying primary happy paths and structural compliance.
- **Tier 2: Boundary & Corner Cases** (`e2e/tier2-boundaries-corner-cases/`):
  - 20 spec files testing edge cases, boundary values, empty inputs, string overflows (10k+ chars), unauthenticated requests, network timeouts, and injection payloads (100 total test cases).
- **Tier 3: Cross-Feature Combinations** (`e2e/tier3-cross-feature-combinations/`):
  - 6 pairwise feature integration specs (30 total test cases) validating inter-service choreography (e.g. MFE dynamic loading + Gateway RPC + Kafka events + Notification dispatch).
- **Tier 4: Real-World Scenarios** (`e2e/tier4-real-world-scenarios/`):
  - 5 realistic multi-step user workflows (25 total test cases) simulating actual user journeys (Onboarding, Incident Resolution, Subscription Lifecycle, AI RAG Document Q&A, and Cross-MFE Collaborative Workspace).

---

## 3. Test Harness Modules (`e2e/harness/`)

The test harness provides reusable, strictly typed interfaces and emulators:

| Module | File Path | Responsibilities |
|---|---|---|
| **Domain & Test Types** | [`e2e/harness/test-types.ts`](file:///Users/dweb/angular/ng-console/e2e/harness/test-types.ts) | Enforces strict domain interfaces for User, Ticket, Document, Payment, Chat, Notification, Audit, Kafka events, and K8s manifests with zero `any`. |
| **API Client Harness** | [`e2e/harness/api-client.ts`](file:///Users/dweb/angular/ng-console/e2e/harness/api-client.ts) | Provides typed HTTP REST interaction with JWT authentication, header management, and error serialization. |
| **RPC Transport Harness** | [`e2e/harness/rpc-harness.ts`](file:///Users/dweb/angular/ng-console/e2e/harness/rpc-harness.ts) | Verifies synchronous TCP and Redis microservice message patterns against interface contracts defined in `libs/contracts`. |
| **Kafka Event Harness** | [`e2e/harness/kafka-harness.ts`](file:///Users/dweb/angular/ng-console/e2e/harness/kafka-harness.ts) | In-memory and live event stream bus with schema validation, monotonic offsets, topic subscription, and event assertion predicates. |
| **Native Federation Harness** | [`e2e/harness/mfe-harness.ts`](file:///Users/dweb/angular/ng-console/e2e/harness/mfe-harness.ts) | Emulates Native Federation dynamic ESM module loading, manifest resolution, shared singletons preservation, and error boundary fallbacks. |
| **Infra & Manifest Validator** | [`e2e/harness/infra-validator.ts`](file:///Users/dweb/angular/ng-console/e2e/harness/infra-validator.ts) | Inspects Dockerfiles (unprivileged Nginx, non-root `node`, `dumb-init` PID 1) and Kubernetes manifests (Deployments, Services, Ingress, ConfigMaps, Secrets). |
| **Unified Test Context** | [`e2e/harness/test-context.ts`](file:///Users/dweb/angular/ng-console/e2e/harness/test-context.ts) | Factory creating unified `TestContext` instances with complete reset capabilities between runs. |

---

## 4. Test Execution & CLI Commands

### 1. Playwright Test Runner (Full Suite & Tiers)
```bash
# Execute entire 4-tier E2E test suite (262 tests)
npm run e2e
# or
./node_modules/.bin/playwright test

# Execute Tier 1 only (Feature Coverage)
npm run e2e:tier1

# Execute Tier 2 only (Boundary & Corner Cases)
npm run e2e:tier2

# Execute Tier 3 only (Cross-Feature Combinations)
npm run e2e:tier3

# Execute Tier 4 only (Real-World Scenarios)
npm run e2e:tier4
```

### 2. Standalone Unified CLI Harness Runner
```bash
# Execute unified test harness runner with ANSI summary table
npm run e2e:harness

# Run specific tier via CLI
./node_modules/.bin/ts-node -O '{"module":"CommonJS"}' e2e/runner/cli.ts --tier 1

# Run specific feature tests via CLI
./node_modules/.bin/ts-node -O '{"module":"CommonJS"}' e2e/runner/cli.ts --feature F04
```
