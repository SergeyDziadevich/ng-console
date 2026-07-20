import { Component, input, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DocumentService } from '../../../services/document.service';

interface DocumentSnippet {
  id: string;
  filename: string;
  snippet: string;
}

interface DocumentWidgetData {
  type: string;
  documents: DocumentSnippet[];
}

@Component({
  selector: 'app-document-widget',
  imports: [CommonModule],
  templateUrl: './document-widget.html',
  styleUrls: ['./document-widget.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentWidget implements OnInit {
  text = input<string>('');

  documents = signal<DocumentSnippet[]>([]);
  isDownloading = signal<string | null>(null);
  conversationalText = signal<string>('');

  private router = inject(Router);
  private documentService = inject(DocumentService);

  ngOnInit() {
    this.parseDocuments();
  }

  parseDocuments() {
    try {
      const match = this.text().match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
      let jsonToParse = this.text();
      
      if (match) {
        jsonToParse = match[1];
        this.conversationalText.set(this.text().replace(match[0], '').trim());
      } else {
        this.conversationalText.set('');
      }

      const parsed: DocumentWidgetData = JSON.parse(jsonToParse);
      if (parsed.documents && Array.isArray(parsed.documents)) {
        this.documents.set(parsed.documents);
      }
    } catch (e) {
      console.error('Failed to parse document widget data', e);
    }
  }

  downloadDocument(doc: DocumentSnippet) {
    this.isDownloading.set(doc.id);
    this.documentService.downloadDocument(doc.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.filename;
        a.click();
        window.URL.revokeObjectURL(url);
        this.isDownloading.set(null);
      },
      error: () => {
        console.error('Failed to download document');
        this.isDownloading.set(null);
      }
    });
  }

  viewDocument(doc: DocumentSnippet) {
    // Navigate to preview route with basic info
    this.router.navigate(['/documents', doc.id, 'view'], {
      state: {
        document: {
          _id: doc.id,
          filename: doc.filename,
          mimeType: 'application/pdf',
        }
      }
    });
  }
}
