import { ChangeDetectionStrategy, Component, signal, inject, OnInit, OnDestroy, ElementRef, viewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DocumentService } from "@ng-console/shared/data-access";
import { environment } from "@env/environment";
import SignaturePad from 'signature_pad';

@Component({
  selector: 'app-external-signature',
  imports: [CommonModule, FormsModule],
  templateUrl: './external-signature.html',
  styleUrls: ['./external-signature.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExternalSignatureComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private documentService = inject(DocumentService);
  private sanitizer = inject(DomSanitizer);
  private signaturePad: SignaturePad | null = null;
  private objectUrl: string | null = null;

  token = signal<string | null>(null);
  document = signal<{ _id: string; filename: string; partyASignatureName?: string } | null>(null);
  documentPreviewUrl = signal<SafeResourceUrl | null>(null);
  signatureName = signal<string>('');
  isLoading = signal(true);
  isSigning = signal(false);
  isSuccess = signal(false);
  errorMessage = signal<string | null>(null);
  signatureCanvas = viewChild<ElementRef<HTMLCanvasElement>>('signatureCanvas');

  constructor() {
    effect(() => {
      const canvasRef = this.signatureCanvas();
      if (canvasRef && !this.signaturePad) {
        // Wait a tick for styles to apply completely before getting offsetWidth
        setTimeout(() => this.setupSignaturePad(canvasRef.nativeElement), 10);
      }
    });
  }

  ngOnDestroy() {
    if (this.objectUrl) {
      window.URL.revokeObjectURL(this.objectUrl);
    }
    if (this.signaturePad) {
      this.signaturePad.off();
    }
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['token']) {
        this.token.set(params['token']);
        this.loadDocument();
      } else {
        this.errorMessage.set('Invalid or missing signature token.');
        this.isLoading.set(false);
      }
    });
  }

  loadDocument() {
    const currentToken = this.token();
    if (!currentToken) return;

    this.documentService.getExternalDocument(currentToken).subscribe({
      next: (doc: { _id: string; filename: string; partyASignatureName?: string }) => {
        this.document.set(doc);
        this.loadPreview();
      },
      error: (err: unknown) => {
        console.error('Failed to load document', err);
        this.errorMessage.set('The signature link is invalid or has expired.');
        this.isLoading.set(false);
      },
    });
  }

  loadPreview() {
    const currentToken = this.token();
    if (!currentToken) return;

    this.documentService.downloadExternalDocument(currentToken).subscribe({
      next: (blob) => {
        if (this.objectUrl) {
          window.URL.revokeObjectURL(this.objectUrl);
        }
        this.objectUrl = window.URL.createObjectURL(blob);
        this.documentPreviewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl));
        this.isLoading.set(false);
      },
      error: (err: unknown) => {
        console.error('Failed to load document preview', err);
        this.isLoading.set(false); // still clear loading state so user can sign without preview if it fails
      },
    });
  }

  private setupSignaturePad(canvas: HTMLCanvasElement) {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext('2d')?.scale(ratio, ratio);

    this.signaturePad = new SignaturePad(canvas, {
      penColor: 'rgb(0, 0, 0)',
      backgroundColor: 'rgba(0,0,0,0)',
    });
    console.log('Signature pad initialized successfully via effect');
  }

  clearSignature() {
    if (this.signaturePad) {
      this.signaturePad.clear();
    }
  }

  downloadDocument() {
    const currentToken = this.token();
    const currentDoc = this.document();
    if (!currentToken || !currentDoc) return;

    // Use environment directly since apiUrl is private
    window.open(`${environment.apiUrl}/api/documents/external/${currentToken}/download`, '_blank');
  }

  signDocument() {
    const currentToken = this.token();
    const name = this.signatureName().trim();

    if (!currentToken || !name) {
      this.errorMessage.set('Please type your name to sign.');
      return;
    }

    let signatureImage: string | undefined;
    if (this.signaturePad && !this.signaturePad.isEmpty()) {
      signatureImage = this.signaturePad.toDataURL('image/png');
    }

    this.isSigning.set(true);
    this.errorMessage.set(null);

    this.documentService.signExternalDocument(currentToken, name, signatureImage).subscribe({
      next: () => {
        this.isSuccess.set(true);
        this.isSigning.set(false);
      },
      error: (err: unknown) => {
        console.error('Failed to sign document', err);
        this.errorMessage.set('Failed to submit signature. Please try again.');
        this.isSigning.set(false);
      },
    });
  }
}
