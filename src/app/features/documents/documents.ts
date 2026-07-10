import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { HttpEventType } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { DocumentService } from '../../services/document.service';
import { AuthService } from '../../services/auth.service';
import { UploadedDocument } from '../../models/document.model';
import { UserRole } from '../../enums/user-role.enum';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideUploadCloud, lucideTrash2, lucideDownload, lucideFile, lucideShare2, lucideFileSignature, lucideEye, lucideFileText, lucideFilePlus } from '@ng-icons/lucide';
import { Toast } from '../../components/toast/toast';
import { environment } from '../../../environments/environment';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { Router, RouterLink, NavigationEnd, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-documents',
  imports: [CommonModule, NgIconComponent, Toast, RouterLink, ConfirmDialogComponent],
  templateUrl: './documents.html',
  styleUrls: ['./documents.scss'],
  viewProviders: [provideIcons({ lucideUploadCloud, lucideTrash2, lucideDownload, lucideFile, lucideShare2, lucideFilePlus, lucideFileSignature, lucideEye, lucideFileText })]
})
export class DocumentsComponent implements OnInit {
  private documentService = inject(DocumentService);
  private authService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);

  private router = inject(Router);
  private route = inject(ActivatedRoute);
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

  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  isAdmin = computed(() => {
    const user = this.authService.currentUser();
    return user?.role === UserRole.Admin || user?.role === UserRole.Moderator;
  });
  totalPages = computed(() => Math.ceil(this.totalDocuments() / this.pageSize()));

  private previousUrl = '';

  constructor() {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe((event) => {
      if (this.previousUrl && this.previousUrl !== '/documents' && event.urlAfterRedirects === '/documents') {
        this.loadDocuments();
      }
      this.previousUrl = event.urlAfterRedirects;
    });
  }

  ngOnInit() {
    this.loadDocuments();
    this.route.queryParams.subscribe(params => {
      if (params['generated']) {
        this.showToast('Document generated successfully');
      }
    });
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
    this.router.navigate(['/documents', doc._id, mode], { state: { document: doc } });
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
