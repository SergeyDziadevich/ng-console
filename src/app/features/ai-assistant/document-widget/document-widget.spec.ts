import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DocumentWidget } from './document-widget';
import { DocumentService } from '../../../services/document.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi, Mock } from 'vitest';

describe('DocumentWidget', () => {
  let component: DocumentWidget;
  let fixture: ComponentFixture<DocumentWidget>;
  let mockDocumentService: { downloadDocument: Mock };
  let mockRouter: { navigate: Mock };

  beforeEach(async () => {
    mockDocumentService = {
      downloadDocument: vi.fn()
    };
    mockRouter = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [DocumentWidget],
      providers: [
        { provide: DocumentService, useValue: mockDocumentService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentWidget);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('parseDocuments', () => {
    it('should parse pure JSON', () => {
      fixture.componentRef.setInput('text', JSON.stringify({
        type: 'documentWidget',
        documents: [{ id: '1', filename: 'test.pdf', snippet: 'test snippet' }]
      }));
      component.parseDocuments();
      expect(component.documents().length).toBe(1);
      expect(component.conversationalText()).toBe('');
    });

    it('should parse JSON inside markdown block', () => {
      fixture.componentRef.setInput('text', '```json\n{"type": "documentWidget", "documents": [{"id": "2", "filename": "test2.pdf", "snippet": "snippet2"}]}\n```');
      component.parseDocuments();
      expect(component.documents().length).toBe(1);
      expect(component.documents()[0].id).toBe('2');
      expect(component.conversationalText()).toBe('');
    });

    it('should extract conversational text and parse JSON', () => {
      const conversational = 'Here are the documents you requested:';
      fixture.componentRef.setInput('text', `${conversational}\n\n\`\`\`json\n{"type": "documentWidget", "documents": [{"id": "3", "filename": "doc.pdf", "snippet": "..."}]}\n\`\`\``);
      component.parseDocuments();
      expect(component.documents().length).toBe(1);
      expect(component.conversationalText()).toBe(conversational);
    });

    it('should handle malformed JSON gracefully', () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      fixture.componentRef.setInput('text', '```json\n{invalid json}\n```');
      component.parseDocuments();
      expect(component.documents().length).toBe(0);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('viewDocument', () => {
    it('should navigate to the document view route', () => {
      const doc = { id: '123', filename: 'test.pdf', snippet: 'test' };
      component.viewDocument(doc);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/documents', '123', 'view'], {
        state: {
          document: {
            _id: '123',
            filename: 'test.pdf',
            mimeType: 'application/pdf',
          }
        }
      });
    });
  });

  describe('downloadDocument', () => {
    it('should download the document when API succeeds', () => {
      const doc = { id: '456', filename: 'download.pdf', snippet: 'download me' };
      const blob = new Blob(['test content'], { type: 'application/pdf' });
      mockDocumentService.downloadDocument.mockReturnValue(of(blob));
      
      const createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:test');
      const revokeObjectURLSpy = vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => undefined);
      
      const mockAnchor = { href: '', download: '', click: vi.fn() } as unknown as HTMLAnchorElement;
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);

      component.downloadDocument(doc);

      expect(mockDocumentService.downloadDocument).toHaveBeenCalledWith('456');
      expect(component.isDownloading()).toBeNull();
      expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
      expect(mockAnchor.href).toBe('blob:test');
      expect(mockAnchor.download).toBe('download.pdf');
      expect(mockAnchor.click).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:test');
    });

    it('should handle API failure gracefully', () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const doc = { id: '789', filename: 'fail.pdf', snippet: 'fail' };
      mockDocumentService.downloadDocument.mockReturnValue(throwError(() => new Error('Network error')));
      
      component.downloadDocument(doc);
      
      expect(mockDocumentService.downloadDocument).toHaveBeenCalledWith('789');
      expect(console.error).toHaveBeenCalledWith('Failed to download document');
      expect(component.isDownloading()).toBeNull();
    });
  });
});
