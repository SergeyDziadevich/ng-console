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

  it('should handle error on document generation', () => {
    const error = new Error('Generate error');
    mockDocumentService.generateDocument.mockReturnValue(throwError(() => error));

    component.form.patchValue({ templateType: 'invoice' });
    component.onSubmit();

    expect(component.isGenerating).toBe(false);
    expect(component.error).toBe('Failed to generate document. Please try again.');
  });
});
