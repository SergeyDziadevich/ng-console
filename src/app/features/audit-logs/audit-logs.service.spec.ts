import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuditLogsService, AuditLogResponse } from './audit-logs.service';
import { environment } from '../../../environments/environment';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('socket.io-client', () => {
  return {
    io: vi.fn(() => ({
      on: vi.fn(),
      disconnect: vi.fn(),
    })),
  };
});

describe('AuditLogsService', () => {
  let service: AuditLogsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuditLogsService
      ]
    });
    service = TestBed.inject(AuditLogsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch retention days on init', () => {
    const req = httpMock.expectOne(`${environment.apiUrl}/api/audit-logs/settings/retention`);
    expect(req.request.method).toBe('GET');
    req.flush({ retentionDays: 45 });

    expect(service.retentionDays()).toBe(45);
  });

  it('should fetch available actions', () => {
    service.fetchAvailableActions();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/audit-logs/actions`);
    expect(req.request.method).toBe('GET');
    req.flush(['CREATE', 'UPDATE', 'DELETE']);

    expect(service.availableActions()).toEqual(['CREATE', 'UPDATE', 'DELETE']);

    const initReq = httpMock.expectOne(`${environment.apiUrl}/api/audit-logs/settings/retention`);
    initReq.flush({ retentionDays: 30 });
  });

  it('should fetch logs and update state (page 1)', () => {
    service.fetchLogs(1, 50, 'testSearch', '2023-01-01', '2023-12-31', ['CREATE']);

    const expectedUrl = `${environment.apiUrl}/api/audit-logs?page=1&limit=50&search=testSearch&startDate=2023-01-01&endDate=2023-12-31&actions=CREATE`;
    const req = httpMock.expectOne(expectedUrl);
    expect(req.request.method).toBe('GET');

    const mockResponse: AuditLogResponse = {
      items: [{ _id: '1', action: 'CREATE', entityType: 'User', entityId: 'u1', authorId: 'a1', createdAt: 'date', expiresAt: 'date' }],
      total: 100,
      page: 1,
      limit: 50,
      totalPages: 2
    };
    req.flush(mockResponse);

    expect(service.logs().length).toBe(1);
    expect(service.totalLogs()).toBe(100);

    const initReq = httpMock.expectOne(`${environment.apiUrl}/api/audit-logs/settings/retention`);
    initReq.flush({ retentionDays: 30 });
  });

  it('should append logs when fetching page > 1', () => {
    service.logs.set([{ _id: '1', action: 'CREATE', entityType: 'User', entityId: 'u1', authorId: 'a1', createdAt: 'date', expiresAt: 'date' }]);

    service.fetchLogs(2, 50);

    const req = httpMock.expectOne(`${environment.apiUrl}/api/audit-logs?page=2&limit=50&search=`);
    const mockResponse: AuditLogResponse = {
      items: [{ _id: '2', action: 'UPDATE', entityType: 'User', entityId: 'u1', authorId: 'a1', createdAt: 'date', expiresAt: 'date' }],
      total: 100,
      page: 2,
      limit: 50,
      totalPages: 2
    };
    req.flush(mockResponse);

    expect(service.logs().length).toBe(2); // Should have appended

    const initReq = httpMock.expectOne(`${environment.apiUrl}/api/audit-logs/settings/retention`);
    initReq.flush({ retentionDays: 30 });
  });

  it('should set retention days', () => {
    service.setRetentionDays(90);

    const req = httpMock.expectOne(`${environment.apiUrl}/api/audit-logs/settings/retention`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ days: 90 });
    req.flush({ success: true, retentionDays: 90 });

    expect(service.retentionDays()).toBe(90);

    const initReq = httpMock.expectOne(`${environment.apiUrl}/api/audit-logs/settings/retention`);
    initReq.flush({ retentionDays: 30 });
  });
});
