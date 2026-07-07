import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { io, Socket } from 'socket.io-client';

export interface AuditLog {
  _id: string;
  action: string;
  entityType: string;
  entityId: string;
  authorId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  expiresAt: string;
}

export interface AuditLogResponse {
  items: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuditLogsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/audit-logs`;
  private socket!: Socket;

  // State
  logs = signal<AuditLog[]>([]);
  totalLogs = signal<number>(0);
  retentionDays = signal<number>(30);

  constructor() {
    this.initSocket();
    this.fetchRetentionDays();
  }

  private initSocket() {
    const url = new URL(environment.apiUrl);
    this.socket = io(`${url.protocol}//${url.host}`, { transports: ['websocket'] });

    this.socket.on('new-audit-log', (newLog: AuditLog) => {
      this.logs.update(currentLogs => [newLog, ...currentLogs]);
      this.totalLogs.update(total => total + 1);
    });
  }

  async fetchLogs(page = 1, limit = 50, search = '', startDate = '', endDate = '') {
    let queryParams = `?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
    if (startDate) queryParams += `&startDate=${encodeURIComponent(startDate)}`;
    if (endDate) queryParams += `&endDate=${encodeURIComponent(endDate)}`;

    this.http.get<AuditLogResponse>(`${this.apiUrl}${queryParams}`)
      .subscribe(response => {
        if (page === 1) {
          this.logs.set(response.items);
        } else {
          this.logs.update(current => [...current, ...response.items]);
        }
        this.totalLogs.set(response.total);
      });
  }

  async fetchRetentionDays() {
    this.http.get<{ retentionDays: number }>(`${this.apiUrl}/settings/retention`)
      .subscribe(response => {
        this.retentionDays.set(response.retentionDays);
      });
  }

  async setRetentionDays(days: number) {
    this.http.post<{ success: boolean, retentionDays: number }>(`${this.apiUrl}/settings/retention`, { days })
      .subscribe(response => {
        if (response.success) {
          this.retentionDays.set(response.retentionDays);
        }
      });
  }
}
