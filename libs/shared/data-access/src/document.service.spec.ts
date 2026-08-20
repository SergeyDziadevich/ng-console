import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DocumentService } from './document.service';
import { environment } from "@env/environment";
import { HttpEventType, HttpEvent } from '@angular/common/http';
import { PaginatedDocuments } from "@ng-console/shared/models";

describe('DocumentService', () => {
  let service: DocumentService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/api/documents`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DocumentService],
    });
    service = TestBed.inject(DocumentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('uploadDocument', () => {
    it('should upload a file and report progress', () => {
      const mockFile = new File([''], 'test.txt', { type: 'text/plain' });

      service.uploadDocument(mockFile).subscribe((event: HttpEvent<unknown>) => {
        if (event.type === HttpEventType.Response) {
          expect(event.body).toEqual({ id: '123' });
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/upload`);
      expect(req.request.method).toBe('POST');
      expect(req.request.reportProgress).toBe(true);
      expect(req.request.body instanceof FormData).toBe(true);
      expect((req.request.body as FormData).get('file')).toEqual(mockFile);

      req.flush({ id: '123' });
    });
  });

  describe('getDocuments', () => {
    it('should get documents with default pagination params', () => {
      const mockResponse: PaginatedDocuments = {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      service.getDocuments().subscribe((res) => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}?page=1&limit=10`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get documents with custom pagination params', () => {
      service.getDocuments(2, 20).subscribe();
      const req = httpMock.expectOne(`${apiUrl}?page=2&limit=20`);
      expect(req.request.method).toBe('GET');
      req.flush({});
    });
  });

  describe('downloadDocument', () => {
    it('should download a document as a Blob', () => {
      const mockBlob = new Blob(['test'], { type: 'text/plain' });

      service.downloadDocument('doc1').subscribe((blob) => {
        expect(blob).toEqual(mockBlob);
      });

      const req = httpMock.expectOne(`${apiUrl}/doc1`);
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });
  });

  describe('deleteDocument', () => {
    it('should delete a document', () => {
      service.deleteDocument('doc1').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/doc1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });

  describe('shareDocument', () => {
    it('should request a share token for a document', () => {
      const mockResponse = { token: 'abc123token' };

      service.shareDocument('doc1').subscribe((res) => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/doc1/share`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });
});
