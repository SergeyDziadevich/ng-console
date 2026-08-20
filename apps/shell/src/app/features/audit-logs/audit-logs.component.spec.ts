import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuditLogsComponent } from './audit-logs.component';
import { AuditLogsService, AuditLog } from './audit-logs.service';
import { FormsModule } from '@angular/forms';
import { signal, WritableSignal } from '@angular/core';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

describe('AuditLogsComponent', () => {
  let component: AuditLogsComponent;
  let fixture: ComponentFixture<AuditLogsComponent>;
  let mockAuditLogsService: {
    logs: WritableSignal<AuditLog[]>;
    totalLogs: WritableSignal<number>;
    retentionDays: WritableSignal<number>;
    availableActions: WritableSignal<string[]>;
    fetchLogs: Mock;
    fetchAvailableActions: Mock;
    setRetentionDays: Mock;
  };

  beforeEach(async () => {
    mockAuditLogsService = {
      logs: signal([]),
      totalLogs: signal(0),
      retentionDays: signal(30),
      availableActions: signal(['CREATE', 'UPDATE', 'DELETE']),
      fetchLogs: vi.fn(),
      fetchAvailableActions: vi.fn(),
      setRetentionDays: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AuditLogsComponent, FormsModule],
      providers: [{ provide: AuditLogsService, useValue: mockAuditLogsService }],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch logs and actions on init', () => {
    expect(mockAuditLogsService.fetchLogs).toHaveBeenCalled();
    expect(mockAuditLogsService.fetchAvailableActions).toHaveBeenCalled();
  });

  it('should update search query and fetch logs', () => {
    component.onSearchChange('test');
    expect(component.searchQuery()).toBe('test');
    expect(mockAuditLogsService.fetchLogs).toHaveBeenCalledWith(1, 50, 'test', '', '', []);
  });

  it('should toggle action filter and fetch logs', () => {
    component.toggleActionFilter('CREATE');
    expect(component.selectedActions()).toEqual(['CREATE']);
    expect(mockAuditLogsService.fetchLogs).toHaveBeenCalledWith(1, 50, '', '', '', ['CREATE']);

    // Toggle off
    component.toggleActionFilter('CREATE');
    expect(component.selectedActions()).toEqual([]);
  });

  it('should filter available actions based on search query', () => {
    component.actionSearchQuery.set('cre');
    const filtered = component.filteredAvailableActions();
    expect(filtered).toEqual(['CREATE']);
  });

  it('should open retention modal on retention change', () => {
    component.onRetentionChange(60);
    expect(component.pendingRetentionDays()).toBe(60);
    expect(component.showRetentionModal()).toBe(true);
  });

  it('should confirm retention change and close modal', () => {
    component.onRetentionChange(90);
    component.confirmRetentionChange();
    expect(mockAuditLogsService.setRetentionDays).toHaveBeenCalledWith(90);
    expect(component.showRetentionModal()).toBe(false);
  });

  it('should export logs via clicking anchor', () => {
    const createElementSpy = vi.spyOn(document, 'createElement');
    const mockAnchor = {
      setAttribute: vi.fn(),
      click: vi.fn(),
      remove: vi.fn(),
    } as unknown as HTMLAnchorElement;
    createElementSpy.mockReturnValue(mockAnchor);

    const appendChildSpy = vi
      .spyOn(document.body, 'appendChild')
      .mockImplementation((node) => node);

    component.exportLogs();

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(mockAnchor.setAttribute).toHaveBeenCalledWith('download', 'audit_logs.json');
    expect(appendChildSpy).toHaveBeenCalledWith(mockAnchor);
    expect(mockAnchor.click).toHaveBeenCalled();
    expect(mockAnchor.remove).toHaveBeenCalled();
  });
});
