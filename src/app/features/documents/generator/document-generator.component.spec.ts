import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DocumentGeneratorComponent } from './document-generator.component';
import { DocumentService } from '../../../services/document.service';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

describe('DocumentGeneratorComponent', () => {
  let component: DocumentGeneratorComponent;
  let fixture: ComponentFixture<DocumentGeneratorComponent>;
  let mockDocumentService: { generateDocument: Mock };
  let mockRouter: { navigate: Mock };

  beforeEach(async () => {
    mockDocumentService = {
      generateDocument: vi.fn()
    };
    mockRouter = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [DocumentGeneratorComponent, ReactiveFormsModule],
      providers: [
        { provide: DocumentService, useValue: mockDocumentService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentGeneratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    expect(component.form.get('templateType')?.value).toBe('msa');
    expect(component.form.get('noticePeriod')?.value).toBe('1 month(s)');
  });

  it('should clear error on templateType change', () => {
    component.error = 'Some error';
    component.form.patchValue({ templateType: 'contract' });
    expect(component.error).toBeNull();
  });

  it('should navigate to /documents on cancel', () => {
    component.onCancel();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/documents']);
  });

  it('should not submit if form is invalid', () => {
    component.form.controls['templateType'].setValue(null);
    component.onSubmit();
    expect(mockDocumentService.generateDocument).not.toHaveBeenCalled();
  });

  it('should submit an invoice document successfully', () => {
    mockDocumentService.generateDocument.mockReturnValue(of({}));
    
    component.form.patchValue({
      templateType: 'invoice',
      customerName: 'Test Customer',
      description: 'Test Desc',
      amount: '100'
    });

    component.onSubmit();

    expect(component.isGenerating).toBe(false);
    expect(mockDocumentService.generateDocument).toHaveBeenCalledWith({
      templateType: 'invoice',
      data: {
        customerName: 'Test Customer',
        description: 'Test Desc',
        amount: '100'
      }
    });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/documents'], { queryParams: { generated: true } });
  });

  it('should submit a contract document successfully', () => {
    mockDocumentService.generateDocument.mockReturnValue(of({}));
    
    component.form.patchValue({
      templateType: 'contract',
      partyA: 'Company A',
      partyB: 'Company B',
      terms: 'Standard Terms'
    });

    component.onSubmit();

    expect(component.isGenerating).toBe(false);
    expect(mockDocumentService.generateDocument).toHaveBeenCalledWith({
      templateType: 'contract',
      data: {
        partyA: 'Company A',
        partyB: 'Company B',
        terms: 'Standard Terms'
      }
    });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/documents'], { queryParams: { generated: true } });
  });

  it('should submit an MSA document successfully', () => {
    mockDocumentService.generateDocument.mockReturnValue(of({}));
    
    component.form.patchValue({
      templateType: 'msa',
      providerName: 'Provider Company LLC',
      clientName: 'Client Company Inc.',
      effectiveDate: '2026-07-10',
      governingLaw: 'Delaware',
      servicesDescription: 'IT Consulting'
    });

    component.onSubmit();

    expect(component.isGenerating).toBe(false);
    expect(mockDocumentService.generateDocument).toHaveBeenCalledWith({
      templateType: 'msa',
      data: {
        providerName: 'Provider Company LLC',
        clientName: 'Client Company Inc.',
        effectiveDate: '2026-07-10',
        governingLaw: 'Delaware',
        servicesDescription: 'IT Consulting'
      }
    });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/documents'], { queryParams: { generated: true } });
  });


  it('should submit an SLA document successfully', () => {
    mockDocumentService.generateDocument.mockReturnValue(of({}));
    
    component.form.patchValue({
      templateType: 'sla',
      contractorName: 'Provider Inc',
      clientName: 'Client Corp',
      servicesDescription: 'IT Support',
      monthlyFee: '5000',
      noticePeriod: '3 months'
    });

    component.onSubmit();

    expect(component.isGenerating).toBe(false);
    expect(mockDocumentService.generateDocument).toHaveBeenCalledWith({
      templateType: 'sla',
      data: {
        contractorName: 'Provider Inc',
        clientName: 'Client Corp',
        servicesDescription: 'IT Support',
        monthlyFee: '5000',
        noticePeriod: '3 months'
      }
    });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/documents'], { queryParams: { generated: true } });
  });

  it('should render the correct form fields and preview based on templateType', () => {
    // Test MSA template elements
    component.form.patchValue({ templateType: 'msa' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#providerName')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.msa-preview')).toBeTruthy();

    // Test Invoice template elements
    component.form.patchValue({ templateType: 'invoice' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#customerName')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.invoice-preview')).toBeTruthy();

    // Test Contract template elements
    component.form.patchValue({ templateType: 'contract' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#partyA')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.contract-preview')).toBeTruthy();

    // Test B2B Contract PL template elements
    component.form.patchValue({ templateType: 'b2b-contract-pl' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#contractorName')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.b2b-pl-preview')).toBeTruthy();
  });

  it('should handle error on document generation', () => {
    const error = new Error('Generate error');
    mockDocumentService.generateDocument.mockReturnValue(throwError(() => error));

    component.form.patchValue({ templateType: 'invoice' });
    component.onSubmit();

    expect(component.isGenerating).toBe(false);
    expect(component.error).toBe('Failed to generate document. Please try again.');
  });
});
