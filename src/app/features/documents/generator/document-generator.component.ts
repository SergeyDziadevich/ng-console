import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DocumentService } from '../../../services/document.service';

@Component({
  selector: 'app-document-generator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './document-generator.component.html',
  styleUrls: ['./document-generator.component.scss'],
})
export class DocumentGeneratorComponent {
  private fb = inject(FormBuilder);
  private documentService = inject(DocumentService);
  private router = inject(Router);

  form: FormGroup;
  isGenerating = false;
  error: string | null = null;

  constructor() {
    this.form = this.fb.group({
      templateType: ['invoice', Validators.required],
      customerName: [''],
      description: [''],
      amount: [''],
      partyA: [''],
      partyB: [''],
      terms: [''],
      contractorName: [''],
      clientName: [''],
      servicesDescription: [''],
      monthlyFee: [''],
      noticePeriod: ['1 month(s)'],
    });

    this.form.get('templateType')?.valueChanges.subscribe(() => {
      this.error = null;
    });
  }

  onCancel() {
    this.router.navigate(['/documents']);
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.isGenerating = true;
    this.error = null;

    const { templateType, ...allData } = this.form.value;
    const data = templateType === 'invoice' 
      ? { customerName: allData.customerName, description: allData.description, amount: allData.amount }
      : templateType === 'contract'
      ? { partyA: allData.partyA, partyB: allData.partyB, terms: allData.terms }
      : { 
          contractorName: allData.contractorName, 
          clientName: allData.clientName, 
          servicesDescription: allData.servicesDescription,
          monthlyFee: allData.monthlyFee,
          noticePeriod: allData.noticePeriod
        };

    this.documentService.generateDocument({ templateType, data }).subscribe({
      next: () => {
        this.isGenerating = false;
        this.router.navigate(['/documents'], { queryParams: { generated: true } });
      },
      error: (err) => {
        console.error('Error generating document', err);
        this.error = 'Failed to generate document. Please try again.';
        this.isGenerating = false;
      }
    });
  }
}
