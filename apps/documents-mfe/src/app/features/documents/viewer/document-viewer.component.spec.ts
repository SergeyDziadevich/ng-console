import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DocumentViewerComponent } from './document-viewer.component';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { DocumentService } from "@ng-console/shared/data-access";
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

describe('DocumentViewerComponent', () => {
  let component: DocumentViewerComponent;
  let fixture: ComponentFixture<DocumentViewerComponent>;
  let mockDocumentService: { downloadDocument: Mock; signDocument: Mock };
  let mockRouter: { navigate: Mock };

  beforeEach(async () => {
    mockDocumentService = {
      downloadDocument: vi
        .fn()
        .mockReturnValue(of(new Blob(['test'], { type: 'application/pdf' }))),
      signDocument: vi.fn().mockReturnValue(of({})),
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [DocumentViewerComponent],
      providers: [
        { provide: DocumentService, useValue: mockDocumentService },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(new Map(Object.entries({ id: '123', mode: 'view' }))),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentViewerComponent);
    component = fixture.componentInstance;

    // Mock history state
    Object.defineProperty(window, 'history', {
      value: {
        state: { document: { filename: 'test-doc.pdf' } },
      },
      writable: true,
    });

    // Mock URL.createObjectURL
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
    window.URL.revokeObjectURL = vi.fn();

    fixture.detectChanges();
  });

  it('should create and load document', () => {
    expect(component).toBeTruthy();
    expect(component.documentId()).toBe('123');
    expect(component.previewMode()).toBe('view');
    expect(component.documentTitle()).toBe('test-doc.pdf');
    expect(mockDocumentService.downloadDocument).toHaveBeenCalledWith('123');
  });

  it('should close and navigate back', () => {
    component.close();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/documents']);
  });

  it('should not allow signing if mode is view', () => {
    component.executeSign();
    expect(mockDocumentService.signDocument).not.toHaveBeenCalled();
  });

  it('should show toast message and clear it after timeout', () => {
    vi.useFakeTimers();
    component.showToast('Test Toast');
    expect(component.toast()).toBe('Test Toast');
    vi.advanceTimersByTime(3000);
    expect(component.toast()).toBeNull();
    vi.useRealTimers();
  });

  it('should require signature before signing in sign mode', () => {
    component.previewMode.set('sign');
    component.executeSign();
    expect(component.toast()).toBe('Please provide a signature before confirming.');
    expect(mockDocumentService.signDocument).not.toHaveBeenCalled();
  });
});
