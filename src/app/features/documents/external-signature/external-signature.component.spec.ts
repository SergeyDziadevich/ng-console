import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExternalSignatureComponent } from './external-signature.component';
import { ActivatedRoute, Params } from '@angular/router';
import { DocumentService } from '../../../services/document.service';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { vi } from 'vitest';
import SignaturePad from 'signature_pad';

// mock signature_pad because it requires canvas
vi.mock('signature_pad', () => {
  const MockSignaturePad = class {
    clear = vi.fn();
    isEmpty = vi.fn().mockReturnValue(false);
    toDataURL = vi.fn().mockReturnValue('data:image/png;base64,mocksignature');
    off = vi.fn();
  };
  return {
    default: MockSignaturePad
  };
});

describe('ExternalSignatureComponent', () => {
  let component: ExternalSignatureComponent;
  let fixture: ComponentFixture<ExternalSignatureComponent>;
  let mockDocumentService: {
    getExternalDocument: ReturnType<typeof vi.fn>;
    downloadExternalDocument: ReturnType<typeof vi.fn>;
    signExternalDocument: ReturnType<typeof vi.fn>;
  };
  let mockActivatedRoute: {
    queryParams: Observable<Params>;
  };

  beforeEach(async () => {
    mockDocumentService = {
      getExternalDocument: vi.fn().mockReturnValue(of({ _id: 'doc1', filename: 'test.pdf' })),
      downloadExternalDocument: vi.fn().mockReturnValue(of(new Blob(['mock data']))),
      signExternalDocument: vi.fn().mockReturnValue(of({})),
    };

    mockActivatedRoute = {
      queryParams: of({ token: 'mock-token' }),
    };

    vi.stubGlobal('URL', {
      ...globalThis.URL,
      createObjectURL: vi.fn().mockReturnValue('mock-object-url'),
      revokeObjectURL: vi.fn()
    });

    await TestBed.configureTestingModule({
      imports: [ExternalSignatureComponent],
      providers: [
        { provide: DocumentService, useValue: mockDocumentService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExternalSignatureComponent);
    component = fixture.componentInstance;

    Object.defineProperty(component, 'signatureCanvas', {
      value: () => ({
        nativeElement: {
          width: 100,
          height: 100,
          offsetWidth: 100,
          offsetHeight: 100,
          getContext: () => ({
            scale: vi.fn(),
          }),
        },
      }),
      writable: true,
    });

    // Do not call fixture.detectChanges() here to prevent ngOnInit from running automatically
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load document and preview if token is provided', () => {
    mockActivatedRoute.queryParams = of({ token: 'mock-token' });
    fixture.detectChanges();

    expect(component.token()).toBe('mock-token');
    expect(mockDocumentService.getExternalDocument).toHaveBeenCalledWith('mock-token');
    expect(mockDocumentService.downloadExternalDocument).toHaveBeenCalledWith('mock-token');
    expect(component.isLoading()).toBe(false);
    // Sanity check that URL exists
    expect(component.documentPreviewUrl()).toBeTruthy();
  });

  it('should handle missing token', () => {
    mockActivatedRoute.queryParams = of({});
    fixture.detectChanges();

    expect(component.token()).toBeNull();
    expect(component.errorMessage()).toBe('Invalid or missing signature token.');
    expect(component.isLoading()).toBe(false);
  });

  it('should handle failed document loading', () => {
    mockActivatedRoute.queryParams = of({ token: 'mock-token' });
    mockDocumentService.getExternalDocument.mockReturnValue(throwError(() => new Error('Load error')));
    fixture.detectChanges();

    expect(component.errorMessage()).toBe('The signature link is invalid or has expired.');
    expect(component.isLoading()).toBe(false);
  });

  it('should handle failed preview loading gracefully', () => {
    mockActivatedRoute.queryParams = of({ token: 'mock-token' });
    mockDocumentService.downloadExternalDocument.mockReturnValue(throwError(() => new Error('Preview error')));
    fixture.detectChanges();

    expect(component.documentPreviewUrl()).toBeNull();
    expect(component.isLoading()).toBe(false);
  });

  it('should show error if name is empty when signing', () => {
    fixture.detectChanges();
    component.signatureName.set('   ');
    component.signDocument();

    expect(component.errorMessage()).toBe('Please type your name to sign.');
    expect(mockDocumentService.signExternalDocument).not.toHaveBeenCalled();
  });

  it('should call signExternalDocument with signatureImage and handle success', () => {
    fixture.detectChanges();
    component.token.set('mock-token');
    component.signatureName.set('Test User');

    const signaturePadMock = {
      clear: vi.fn(),
      isEmpty: vi.fn().mockReturnValue(false),
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,mocksignature'),
      off: vi.fn(),
    } as unknown as SignaturePad;
    component['signaturePad'] = signaturePadMock;

    component.signDocument();

    expect(component.isSigning()).toBe(false);
    expect(mockDocumentService.signExternalDocument).toHaveBeenCalledWith('mock-token', 'Test User', 'data:image/png;base64,mocksignature');
    expect(component.isSuccess()).toBe(true);
  });

  it('should call signExternalDocument and handle error', () => {
    fixture.detectChanges();
    component.token.set('mock-token');
    component.signatureName.set('Test User');
    mockDocumentService.signExternalDocument.mockReturnValue(throwError(() => new Error('Sign error')));

    component.signDocument();

    expect(component.errorMessage()).toBe('Failed to submit signature. Please try again.');
    expect(component.isSigning()).toBe(false);
  });

  it('should clear signature if signature pad exists', () => {
    fixture.detectChanges();
    const signaturePadMock = {
      clear: vi.fn(),
      isEmpty: vi.fn().mockReturnValue(false),
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,mocksignature'),
      off: vi.fn(),
    } as unknown as SignaturePad;
    component['signaturePad'] = signaturePadMock;

    component.clearSignature();

    expect(component['signaturePad']!.clear).toHaveBeenCalled();
  });

  it('should download document', () => {
    fixture.detectChanges();
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    component.token.set('mock-token');
    component.document.set({ _id: 'doc1', filename: 'test.pdf' });

    component.downloadDocument();

    expect(windowOpenSpy).toHaveBeenCalledWith(`${environment.apiUrl}/api/documents/external/mock-token/download`, '_blank');
  });
});
