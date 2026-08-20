/**
 * Test Harness Types & Strict Domain Interfaces
 * Enforces zero 'any' policy across the entire E2E test suite.
 */

export type UserRole = 'admin' | 'user' | 'manager' | 'support';

export interface IUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  twoFactorEnabled?: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  email: string;
  name: string;
  password?: string;
  role: UserRole;
}

export interface UpdateUserDto {
  name?: string;
  role?: UserRole;
  isActive?: boolean;
}

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface ITicket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedTo?: string;
  createdBy: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketDto {
  title: string;
  description: string;
  priority: TicketPriority;
  assignedTo?: string;
  tags?: string[];
}

export interface IDocument {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  vectorChunkCount: number;
  isSigned: boolean;
  createdAt: string;
}

export interface DocumentChunk {
  chunkIndex: number;
  content: string;
  embedding: number[];
  similarityScore?: number;
}

export interface VectorSearchResult {
  documentId: string;
  title: string;
  snippet: string;
  score: number;
}

export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing';

export interface ISubscription {
  id: string;
  customerId: string;
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface IInvoice {
  id: string;
  customerId: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  pdfUrl?: string;
  paidAt?: string;
  createdAt: string;
}

export interface IChatRoom {
  id: string;
  name: string;
  isDirect: boolean;
  members: string[];
  createdAt: string;
}

export interface IChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

export interface INotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS';
  isRead: boolean;
  createdAt: string;
}

export interface IAuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ICustomer {
  id: string;
  userId: string;
  companyName: string;
  stripeCustomerId: string;
  tier: 'free' | 'pro' | 'enterprise';
  createdAt: string;
}

export interface UserCreatedEvent {
  userId: string;
  email: string;
  name: string;
  role?: string;
  createdAt: string;
}

export interface TicketAssignedEvent {
  ticketId: string;
  title: string;
  userId: string;
  assignedBy?: string;
  priority?: string;
  timestamp: string;
}

export interface SubscriptionActivatedEvent {
  userId: string;
  email: string;
  name: string;
  planName: string;
  planId: string;
  manageLink: string;
  timestamp: string;
}

export interface EmailNotificationEvent {
  to: string;
  name: string;
  message: string;
  link?: string;
  subject?: string;
  template?: string;
  context?: Record<string, unknown>;
}

export interface AuditLogEvent {
  action: string;
  entityType?: string;
  entityId?: string;
  authorId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface DocumentSignedEvent {
  documentId: string;
  title: string;
  signerEmail: string;
  signedAt: string;
  signedUrl?: string;
}

export interface RemoteModuleDescriptor {
  remoteName: string;
  exposedModule: string;
  remoteEntryUrl: string;
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
  loadedSingletons: string[];
}

export interface FederationManifest {
  [remoteName: string]: string;
}

export interface K8sManifestMetadata {
  name: string;
  namespace?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

export interface K8sResourceInspection {
  apiVersion: string;
  kind: string;
  metadata: K8sManifestMetadata;
  spec?: Record<string, unknown>;
  data?: Record<string, string>;
}

export interface DockerfileInspection {
  targetImage: string;
  stages: string[];
  baseImages: string[];
  isNonRoot: boolean;
  hasPid1Handler: boolean;
  exposedPorts: number[];
  healthCheckConfigured: boolean;
}

export interface TestExecutionResult {
  id: string;
  tier: 1 | 2 | 3 | 4;
  featureId: string;
  featureName: string;
  testName: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  durationMs: number;
  error?: string;
}

export interface TierSummary {
  tier: 1 | 2 | 3 | 4;
  tierName: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number;
}
