import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideFileSignature } from '@ng-icons/lucide';
import SignaturePad from 'signature_pad';

import { DocumentService } from '../../../services/document.service';
import { UploadedDocument } from '../../../models/document.model';
import { Toast } from '../../../components/toast/toast';

@Component({
  selector: 'app-document-viewer',
  templateUrl: './document-viewer.component.html',
  styleUrl: './document-viewer.component.scss',
  standalone: true,
  imports: [CommonModule, NgIconComponent, Toast],
  providers: [provideIcons({ lucideFileSignature })],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentViewerComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private documentService = inject(DocumentService);
  private sanitizer = inject(DomSanitizer);

  @ViewChild('signatureCanvas') signatureCanvas?: ElementRef<HTMLCanvasElement>;
  private signaturePad: SignaturePad | null = null;
  private objectUrl: string | null = null;

  documentId = signal<string>('');
  previewMode = signal<'view' | 'sign'>('view');
  documentTitle = signal<string>('Document');

  documentPreviewUrl = signal<SafeResourceUrl | null>(null);
  isLoading = signal<boolean>(true);
  isActionLoading = signal<boolean>(false);
  toast = signal<string | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  pageTitle = computed(() => {
    return this.previewMode() === 'sign' ? 'Preview & Sign Document' : 'Preview Document';
  });

  ngOnInit() {
    // Read route params
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      const mode = params.get('mode') as 'view' | 'sign';

      if (id) {
        this.documentId.set(id);
      }
      if (mode) {
        this.previewMode.set(mode);
      }

      this.loadDocument();
    });

    // Attempt to read document title from router state if available
    const state = history.state as { document?: UploadedDocument };
    if (state?.document?.filename) {
      this.documentTitle.set(state.document.filename);
    }
  }

  ngOnDestroy() {
    this.cleanupObjectUrl();
    if (this.signaturePad) {
      this.signaturePad.off();
    }
  }

  private cleanupObjectUrl() {
    if (this.objectUrl) {
      window.URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }

  showToast(message: string) {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast.set(message);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3000);
  }

  private loadDocument() {
    const id = this.documentId();
    if (!id) return;

    this.isLoading.set(true);
    this.documentService.downloadDocument(id).subscribe({
      next: (blob) => {
        this.cleanupObjectUrl();
        this.objectUrl = window.URL.createObjectURL(blob);
        this.documentPreviewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl));
        this.isLoading.set(false);

        if (this.previewMode() === 'sign') {
          this.initSignaturePad();
        }
      },
      error: (err: unknown) => {
        console.error('Failed to load preview', err);
        this.showToast('Failed to load document preview');
        this.isLoading.set(false);
      },
    });
  }

  private initSignaturePad() {
    // Wait for the next tick so the canvas is rendered
    setTimeout(() => {
      if (this.signatureCanvas) {
        const canvas = this.signatureCanvas.nativeElement;
        // Set canvas resolution correctly to prevent blurriness
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext('2d')?.scale(ratio, ratio);

        this.signaturePad = new SignaturePad(canvas, {
          penColor: 'rgb(0, 0, 0)',
          backgroundColor: 'rgba(0,0,0,0)',
        });
      }
    }, 0);
  }

  clearSignature() {
    if (this.signaturePad) {
      this.signaturePad.clear();
    }
  }

  close() {
    this.router.navigate(['/documents']);
  }

  executeSign() {
    if (this.previewMode() !== 'sign') return;

    let signatureImage: string | undefined;
    if (this.signaturePad && !this.signaturePad.isEmpty()) {
      signatureImage = this.signaturePad.toDataURL('image/png');
    } else {
      this.showToast('Please provide a signature before confirming.');
      return;
    }

    this.isActionLoading.set(true);
    this.documentService.signDocument(this.documentId(), signatureImage).subscribe({
      next: () => {
        this.showToast('Document signed successfully!');
        this.isActionLoading.set(false);
        this.router.navigate(['/documents']);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Failed to sign document', err);
        this.showToast(err.error?.message || 'Failed to sign document');
        this.isActionLoading.set(false);
      },
    });
  }
}
