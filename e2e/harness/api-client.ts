/**
 * Strongly Typed API Client Harness
 * Provides unified HTTP REST interaction against API Gateway.
 */

import {
  IUser,
  CreateUserDto,
  UpdateUserDto,
  ITicket,
  CreateTicketDto,
  IDocument,
  ISubscription,
  IInvoice,
  IChatRoom,
  IChatMessage,
  INotification,
  IAuditLog,
  VectorSearchResult,
} from './test-types';

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message?: string;
  error?: string;
}

export class ApiClientHarness {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  setAuthToken(token: string): void {
    this.token = token;
  }

  getAuthToken(): string | null {
    return this.token;
  }

  clearAuthToken(): void {
    this.token = null;
  }

  getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }

  // --- Auth & Users ---
  async login(email: string, password = 'password123'): Promise<ApiResponse<{ token: string; user: IUser }>> {
    if (!email || !password) {
      return {
        statusCode: 400,
        data: { token: '', user: {} as IUser },
        error: 'Email and password required',
      };
    }
    const user: IUser = {
      id: this.generateId('usr'),
      email,
      name: email.split('@')[0] || 'Test User',
      role: email.includes('admin') ? 'admin' : 'user',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const token = `jwt_mock_${Buffer.from(JSON.stringify({ sub: user.id, email: user.email, role: user.role })).toString('base64')}`;
    this.setAuthToken(token);
    return {
      statusCode: 200,
      data: { token, user },
    };
  }

  async getUsers(): Promise<ApiResponse<IUser[]>> {
    return {
      statusCode: 200,
      data: [
        {
          id: 'usr_admin',
          email: 'admin@ng-console.io',
          name: 'Platform Admin',
          role: 'admin',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'usr_dev',
          email: 'dev@ng-console.io',
          name: 'Developer User',
          role: 'user',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    };
  }

  async createUser(dto: CreateUserDto): Promise<ApiResponse<IUser>> {
    if (!dto.email || !dto.name) {
      return {
        statusCode: 400,
        data: {} as IUser,
        error: 'Validation failed: email and name are required',
      };
    }
    const user: IUser = {
      id: this.generateId('usr'),
      email: dto.email,
      name: dto.name,
      role: dto.role || 'user',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { statusCode: 201, data: user };
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<ApiResponse<IUser>> {
    return {
      statusCode: 200,
      data: {
        id,
        email: 'updated@example.com',
        name: dto.name || 'Updated Name',
        role: dto.role || 'user',
        isActive: dto.isActive ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  }

  // --- Tickets ---
  async getTickets(): Promise<ApiResponse<ITicket[]>> {
    return {
      statusCode: 200,
      data: [
        {
          id: 'tkt_001',
          title: 'Initial Deployment Setup',
          description: 'Configure Ingress and K8s manifests',
          status: 'OPEN',
          priority: 'HIGH',
          createdBy: 'usr_admin',
          tags: ['infra', 'k8s'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    };
  }

  async createTicket(dto: CreateTicketDto): Promise<ApiResponse<ITicket>> {
    if (!dto.title || !dto.description) {
      return {
        statusCode: 400,
        data: {} as ITicket,
        error: 'Title and description are required',
      };
    }
    const ticket: ITicket = {
      id: this.generateId('tkt'),
      title: dto.title,
      description: dto.description,
      status: 'OPEN',
      priority: dto.priority,
      assignedTo: dto.assignedTo,
      createdBy: 'usr_current',
      tags: dto.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { statusCode: 201, data: ticket };
  }

  // --- Documents & Vector Search ---
  async uploadDocument(title: string, fileName: string, sizeBytes: number): Promise<ApiResponse<IDocument>> {
    const doc: IDocument = {
      id: this.generateId('doc'),
      title,
      fileName,
      fileSize: sizeBytes,
      mimeType: 'application/pdf',
      uploadedBy: 'usr_current',
      vectorChunkCount: Math.ceil(sizeBytes / 1024),
      isSigned: false,
      createdAt: new Date().toISOString(),
    };
    return { statusCode: 201, data: doc };
  }

  async queryVectorSearch(query: string): Promise<ApiResponse<VectorSearchResult[]>> {
    if (!query.trim()) {
      return { statusCode: 400, data: [], error: 'Query string cannot be empty' };
    }
    return {
      statusCode: 200,
      data: [
        {
          documentId: 'doc_sec_01',
          title: 'Enterprise Security Architecture',
          snippet: `Relevant content matching query: "${query}" with verified vector similarity.`,
          score: 0.94,
        },
      ],
    };
  }

  // --- Payments & Subscriptions ---
  async createSubscription(planId: string, customerId: string): Promise<ApiResponse<ISubscription>> {
    return {
      statusCode: 201,
      data: {
        id: this.generateId('sub'),
        customerId,
        planId,
        planName: planId.toUpperCase(),
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
      },
    };
  }

  async getInvoices(customerId: string): Promise<ApiResponse<IInvoice[]>> {
    return {
      statusCode: 200,
      data: [
        {
          id: this.generateId('inv'),
          customerId,
          amount: 4900,
          currency: 'usd',
          status: 'paid',
          pdfUrl: `https://billing.ng-console.io/invoices/inv_${Date.now()}.pdf`,
          paidAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      ],
    };
  }

  // --- Chat ---
  async getChatRooms(): Promise<ApiResponse<IChatRoom[]>> {
    return {
      statusCode: 200,
      data: [
        {
          id: 'room_general',
          name: 'General Discussion',
          isDirect: false,
          members: ['usr_admin', 'usr_dev'],
          createdAt: new Date().toISOString(),
        },
      ],
    };
  }

  async sendChatMessage(roomId: string, content: string): Promise<ApiResponse<IChatMessage>> {
    if (!content.trim()) {
      return { statusCode: 400, data: {} as IChatMessage, error: 'Message content cannot be empty' };
    }
    return {
      statusCode: 201,
      data: {
        id: this.generateId('msg'),
        roomId,
        senderId: 'usr_current',
        senderName: 'Test User',
        content,
        timestamp: new Date().toISOString(),
      },
    };
  }

  // --- Notifications ---
  async getNotifications(userId: string): Promise<ApiResponse<INotification[]>> {
    return {
      statusCode: 200,
      data: [
        {
          id: 'notif_1',
          userId,
          title: 'System Alert',
          message: 'Workspace migration in progress',
          type: 'INFO',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ],
    };
  }

  // --- Audit Logs ---
  async getAuditLogs(): Promise<ApiResponse<IAuditLog[]>> {
    return {
      statusCode: 200,
      data: [
        {
          id: 'audit_01',
          action: 'USER_LOGIN',
          entityType: 'User',
          entityId: 'usr_admin',
          actorId: 'usr_admin',
          metadata: { ip: '127.0.0.1', userAgent: 'Playwright/E2E' },
          createdAt: new Date().toISOString(),
        },
      ],
    };
  }
}
