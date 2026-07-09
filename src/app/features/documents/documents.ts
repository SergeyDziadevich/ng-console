import { Component, computed, inject, signal, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpEventType } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { DocumentService } from '../../services/document.service';
import { AuthService } from '../../services/auth.service';
import { UploadedDocument } from '../../models/document.model';
import { UserRole } from '../../enums/user-role.enum';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideUploadCloud, lucideTrash2, lucideDownload, lucideFile, lucideShare2, lucideFileSignature, lucideEye, lucideFileText } from '@ng-icons/lucide';
import { Toast } from '../../components/toast/toast';
import { environment } from '../../../environments/environment';
import SignaturePad from 'signature_pad';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-documents',
  imports: [CommonModule, NgIconComponent, Toast, ConfirmDialogComponent],
  templateUrl: './documents.html',
  styleUrls: ['./documents.scss'],
  viewProviders: [provideIcons({ lucideUploadCloud, lucideTrash2, lucideDownload, lucideFile, lucideShare2, lucideFileSignature, lucideEye, lucideFileText })]
})
export class DocumentsComponent implements OnInit {
  private documentService = inject(DocumentService);
  private authService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);

  // State
  documents = signal<UploadedDocument[]>([]);
  totalDocuments = signal<number>(0);
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  isLoading = signal<boolean>(false);
  uploadProgress = signal<number | null>(null);
  uploadError = signal<string | null>(null);
  toast = signal<string | null>(null);
  isActionLoading = signal<boolean>(false);
  documentToDelete = signal<UploadedDocument | null>(null);
  documentToPreview = signal<UploadedDocument | null>(null);
  documentPreviewUrl = signal<SafeUrl | null>(null);
  previewMode = signal<'sign' | 'view' | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  @ViewChild('signatureCanvas') signatureCanvas!: ElementRef<HTMLCanvasElement>;
  private signaturePad: SignaturePad | null = null;

  isAdmin = computed(() => {
    const user = this.authService.currentUser();
    return user?.role === UserRole.Admin || user?.role === UserRole.Moderator;
  });
  totalPages = computed(() => Math.ceil(this.totalDocuments() / this.pageSize()));

  ngOnInit() {
    this.loadDocuments();
  }

  showToast(message: string) {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast.set(message);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3000);
  }

  loadDocuments() {
    this.isLoading.set(true);
    this.documentService.getDocuments(this.currentPage(), this.pageSize()).subscribe({
      next: (res) => {
        this.documents.set(res.items);
        this.totalDocuments.set(res.total);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading documents', err);
        this.isLoading.set(false);
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.uploadFile(event.dataTransfer.files[0]);
    }
  }

  uploadFile(file: File) {
    // Basic validation
    const allowedExtensions = ['doc', 'docx', 'pdf', 'img', 'png', 'jpg', 'jpeg'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedExtensions.includes(ext)) {
      this.uploadError.set('Invalid file type. Allowed: .doc, .docx, .pdf, .img, .png, .jpg');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.uploadError.set('File is too large. Max size is 10MB.');
      return;
    }

    this.uploadError.set(null);
    this.uploadProgress.set(0);

    this.documentService.uploadDocument(file).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          if (event.total) {
            const progress = Math.round(100 * event.loaded / event.total);
            this.uploadProgress.set(progress);
          }
        } else if (event.type === HttpEventType.Response) {
          this.uploadProgress.set(null);
          this.loadDocuments(); // Reload list
        }
      },
      error: (err) => {
        console.error('Upload failed', err);
        this.uploadError.set(err.error?.message || 'Upload failed');
        this.uploadProgress.set(null);
      }
    });
  }

  downloadDocument(doc: UploadedDocument) {
    this.documentService.downloadDocument(doc._id).subscribe((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.filename;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  confirmDelete(doc: UploadedDocument) {
    this.documentToDelete.set(doc);
  }

  cancelDelete() {
    this.documentToDelete.set(null);
  }

  executeDelete() {
    const doc = this.documentToDelete();
    if (doc) {
      this.documentService.deleteDocument(doc._id).subscribe(() => {
        this.loadDocuments();
        this.documentToDelete.set(null);
        this.showToast('Document deleted successfully');
      });
    }
  }

  shareDocument(doc: UploadedDocument) {
    this.documentService.shareDocument(doc._id).subscribe({
      next: (res) => {
        const shareUrl = `${environment.apiUrl}/api/documents/shared/${res.token}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
          this.showToast('Share link copied to clipboard!');
        }).catch(err => {
          console.error('Failed to copy link', err);
          this.showToast(`Share link generated: ${shareUrl}`);
        });
      },
      error: (err) => {
        console.error('Failed to generate share link', err);
      }
    });
  }

  openPreview(doc: UploadedDocument, mode: 'sign' | 'view') {
    this.isActionLoading.set(true);
    this.documentService.downloadDocument(doc._id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        this.documentPreviewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
        this.documentToPreview.set(doc);
        this.previewMode.set(mode);
        this.isActionLoading.set(false);
        
        if (mode === 'sign') {
          setTimeout(() => {
            if (this.signatureCanvas) {
              const canvas = this.signatureCanvas.nativeElement;
              // Set canvas resolution correctly
              const ratio = Math.max(window.devicePixelRatio || 1, 1);
              canvas.width = canvas.offsetWidth * ratio;
              canvas.height = canvas.offsetHeight * ratio;
              canvas.getContext('2d')?.scale(ratio, ratio);
              
              this.signaturePad = new SignaturePad(canvas, {
                penColor: 'rgb(0, 0, 0)',
                backgroundColor: 'rgba(0,0,0,0)'
              });
            }
          }, 0);
        }
      },
      error: (err) => {
        console.error('Failed to load preview', err);
        this.showToast('Failed to load document preview');
        this.isActionLoading.set(false);
      }
    });
  }

  cancelPreview() {
    this.documentToPreview.set(null);
    this.documentPreviewUrl.set(null);
    this.previewMode.set(null);
    this.signaturePad = null;
  }

  clearSignature() {
    if (this.signaturePad) {
      this.signaturePad.clear();
    }
  }

  executeSign() {
    const doc = this.documentToPreview();
    if (!doc) return;

    let signatureImage: string | undefined;
    if (this.previewMode() === 'sign' && this.signaturePad && !this.signaturePad.isEmpty()) {
      signatureImage = this.signaturePad.toDataURL('image/png');
    }

    this.isActionLoading.set(true);
    this.documentService.signDocument(doc._id, signatureImage).subscribe({
      next: () => {
        this.showToast('Document signed successfully!');
        this.loadDocuments();
        this.cancelPreview();
        this.isActionLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to sign document', err);
        this.showToast(err.error?.message || 'Failed to sign document');
        this.isActionLoading.set(false);
      }
    });
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.loadDocuments();
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadDocuments();
    }
  }

  formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  getUploaderName(doc: UploadedDocument): string {
    if (typeof doc.uploadedBy === 'string') return doc.uploadedBy;
    return doc.uploadedBy?.displayName || doc.uploadedBy?.username || doc.uploadedBy?.email || 'Unknown';
  }
}
