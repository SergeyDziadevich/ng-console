import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DocumentsComponent } from './documents';
import { DocumentService } from '../../services/document.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user-service';
import { UserRole } from '../../enums/user-role.enum';
import { of, throwError } from 'rxjs';
import { UploadedDocument } from '../../models/document.model';
import { ActivatedRoute } from '@angular/router';
import { signal, WritableSignal } from '@angular/core';
import { HttpEventType, HttpResponse, HttpProgressEvent } from '@angular/common/http';
import { vi, describe, it, expect, beforeEach, afterEach, Mock } from 'vitest';

describe('DocumentsComponent', () => {
  let component: DocumentsComponent;
  let fixture: ComponentFixture<DocumentsComponent>;
  let documentServiceSpy: {
    getDocuments: Mock;
    uploadDocument: Mock;
    downloadDocument: Mock;
    deleteDocument: Mock;
    shareDocument: Mock;
  };
  let mockAuthService: {
    currentUser: WritableSignal<{ id: string; username: string; role: UserRole }>;
  };

  beforeEach(async () => {
    documentServiceSpy = {
      getDocuments: vi.fn().mockReturnValue(of({
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1
      })),
      uploadDocument: vi.fn(),
      downloadDocument: vi.fn(),
      deleteDocument: vi.fn(),
      shareDocument: vi.fn()
    };

    mockAuthService = {
      currentUser: signal({ id: '1', username: 'admin', role: UserRole.Admin })
    };

    await TestBed.configureTestingModule({
      imports: [DocumentsComponent],
      providers: [
        { provide: DocumentService, useValue: documentServiceSpy },
        { provide: AuthService, useValue: mockAuthService },
        { provide: UserService, useValue: { getUserById: vi.fn().mockReturnValue(of({ settings: {} })) } },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load documents on init', () => {
      expect(documentServiceSpy.getDocuments).toHaveBeenCalledWith(1, 10);
      expect(component.isLoading()).toBe(false);
      expect(component.documents()).toEqual([]);
      expect(component.totalDocuments()).toBe(0);
    });
  });

  describe('Permissions', () => {
    it('should identify admin correctly', () => {
      expect(component.isAdmin()).toBe(true);
      
      mockAuthService.currentUser.set({ id: '2', username: 'user', role: UserRole.User });
      expect(component.isAdmin()).toBe(false);
    });
  });

  describe('Pagination', () => {
    it('should navigate to next and previous pages', () => {
      documentServiceSpy.getDocuments.mockReturnValue(of({
        items: [],
        total: 25,
        page: 1,
        limit: 10,
        totalPages: 3
      }));
      component.loadDocuments();
      expect(component.totalPages()).toBe(3);

      component.nextPage();
      expect(component.currentPage()).toBe(2);
      expect(documentServiceSpy.getDocuments).toHaveBeenCalledWith(2, 10);

      component.prevPage();
      expect(component.currentPage()).toBe(1);
      expect(documentServiceSpy.getDocuments).toHaveBeenCalledWith(1, 10);
    });

    it('should not navigate out of bounds', () => {
      component.prevPage();
      expect(component.currentPage()).toBe(1);

      documentServiceSpy.getDocuments.mockReturnValue(of({
        items: [],
        total: 5,
        page: 1,
        limit: 10,
        totalPages: 1
      }));
      component.loadDocuments();
      
      component.nextPage();
      expect(component.currentPage()).toBe(1);
    });
  });

  describe('uploadFile', () => {
    it('should reject invalid file types', () => {
      const invalidFile = new File([''], 'test.exe', { type: 'application/x-msdownload' });
      component.uploadFile(invalidFile);
      expect(component.uploadError()).toContain('Invalid file type');
      expect(documentServiceSpy.uploadDocument).not.toHaveBeenCalled();
    });

    it('should reject oversized files', () => {
      const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 });
      
      component.uploadFile(largeFile);
      expect(component.uploadError()).toContain('File is too large');
      expect(documentServiceSpy.uploadDocument).not.toHaveBeenCalled();
    });

    it('should handle successful upload with progress', () => {
      const validFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      
      const uploadEvent1 = { type: HttpEventType.UploadProgress, loaded: 50, total: 100 } as HttpProgressEvent;
      const uploadEvent2 = new HttpResponse({ body: {} });
      
      documentServiceSpy.uploadDocument.mockReturnValue(of(uploadEvent1, uploadEvent2));
      
      vi.spyOn(component, 'loadDocuments');

      component.uploadFile(validFile);

      expect(documentServiceSpy.uploadDocument).toHaveBeenCalledWith(validFile);
      expect(component.uploadError()).toBeNull();
      
      expect(component.uploadProgress()).toBeNull();
      expect(component.loadDocuments).toHaveBeenCalled();
    });

    it('should handle upload error', () => {
      const validFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      documentServiceSpy.uploadDocument.mockReturnValue(throwError(() => ({ error: { message: 'Server error' } })));
      
      component.uploadFile(validFile);
      
      expect(component.uploadError()).toBe('Server error');
      expect(component.uploadProgress()).toBeNull();
    });
  });

  describe('Delete Document Flow', () => {
    it('should set documentToDelete on confirmDelete', () => {
      const mockDoc = { _id: 'doc-1', filename: 'test.pdf' };
      component.confirmDelete(mockDoc as unknown as UploadedDocument);
      expect(component.documentToDelete()).toEqual(mockDoc);
    });

    it('should clear documentToDelete on cancelDelete', () => {
      component.documentToDelete.set({ _id: 'doc-1', filename: 'test.pdf' } as unknown as UploadedDocument);
      component.cancelDelete();
      expect(component.documentToDelete()).toBeNull();
    });

    it('should call deleteDocument and reload list on executeDelete', () => {
      const mockDoc = { _id: 'doc-1', filename: 'test.pdf' };
      component.documentToDelete.set(mockDoc as unknown as UploadedDocument);
      
      vi.spyOn(component, 'loadDocuments');
      documentServiceSpy.deleteDocument.mockReturnValue(of({}));

      component.executeDelete();

      expect(documentServiceSpy.deleteDocument).toHaveBeenCalledWith('doc-1');
      expect(component.loadDocuments).toHaveBeenCalled();
      expect(component.documentToDelete()).toBeNull();
      expect(component.toast()).toContain('Document deleted');
    });

    it('should do nothing if documentToDelete is null on executeDelete', () => {
      component.documentToDelete.set(null);
      component.executeDelete();
      expect(documentServiceSpy.deleteDocument).not.toHaveBeenCalled();
    });
  });

  describe('shareDocument', () => {
    it('should generate share link and copy to clipboard', async () => {
      const mockDoc = { _id: 'doc-1', filename: 'test.pdf', mimeType: 'application/pdf', size: 100, createdAt: new Date() };
      documentServiceSpy.shareDocument.mockReturnValue(of({ token: 'xyz123' }));
      
      const mockClipboard = {
        writeText: vi.fn().mockResolvedValue(undefined)
      };
      Object.assign(navigator, { clipboard: mockClipboard });

      component.shareDocument(mockDoc as unknown as UploadedDocument);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(documentServiceSpy.shareDocument).toHaveBeenCalledWith('doc-1');
      expect(mockClipboard.writeText).toHaveBeenCalledWith(expect.stringMatching(/xyz123$/));
      expect(component.toast()).toContain('copied to clipboard');
    });

    it('should show error toast if copy fails', async () => {
      const mockDoc = { _id: 'doc-1', filename: 'test.pdf', mimeType: 'application/pdf', size: 100, createdAt: new Date() };
      documentServiceSpy.shareDocument.mockReturnValue(of({ token: 'xyz123' }));
      
      const mockClipboard = {
        writeText: vi.fn().mockRejectedValue('copy error')
      };
      Object.assign(navigator, { clipboard: mockClipboard });
      
      vi.spyOn(console, 'error').mockImplementation(() => undefined);

      component.shareDocument(mockDoc as unknown as UploadedDocument);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(component.toast()).toContain('Share link generated:');
    });
  });

  describe('downloadDocument', () => {
    it('should trigger document download', () => {
      const mockDoc = { _id: 'doc-1', filename: 'test.pdf', mimeType: 'application/pdf', size: 100, createdAt: new Date() };
      const mockBlob = new Blob(['data']);
      documentServiceSpy.downloadDocument.mockReturnValue(of(mockBlob));
      
      const aSpy = { href: '', download: '', click: vi.fn() };
      vi.spyOn(document, 'createElement').mockReturnValue(aSpy as unknown as HTMLAnchorElement);
      vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:url');
      vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => undefined);

      component.downloadDocument(mockDoc as unknown as UploadedDocument);

      expect(documentServiceSpy.downloadDocument).toHaveBeenCalledWith('doc-1');
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(window.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(aSpy.href).toBe('blob:url');
      expect(aSpy.download).toBe('test.pdf');
      expect(aSpy.click).toHaveBeenCalled();
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:url');
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(component.formatBytes(0)).toBe('0 Bytes');
      expect(component.formatBytes(1024)).toBe('1 KB');
      expect(component.formatBytes(1536)).toBe('1.5 KB');
      expect(component.formatBytes(1048576)).toBe('1 MB');
    });
  });
});
