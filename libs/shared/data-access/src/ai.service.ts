import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from "@env/environment";

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/ai`;

  readonly messages = signal<ChatMessage[]>([]);
  readonly isGenerating = signal(false);
  readonly isCommandPaletteOpen = signal(false);

  toggleCommandPalette() {
    this.isCommandPaletteOpen.update((v) => !v);
  }

  closeCommandPalette() {
    this.isCommandPaletteOpen.set(false);
  }

  async generate(message: string): Promise<void> {
    const currentMessages = this.messages();
    const payload = {
      message,
      messages: currentMessages,
    };

    // Optimistically add user message
    this.messages.update((msgs) => [...msgs, { role: 'user', content: message }]);
    this.isGenerating.set(true);

    try {
      const response = await this.http
        .post<{ text: string }>(`${this.baseUrl}/generate`, payload)
        .toPromise();

      if (response && response.text) {
        this.messages.update((msgs) => [...msgs, { role: 'model', content: response.text }]);
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      this.messages.update((msgs) => [
        ...msgs,
        { role: 'model', content: 'An error occurred while generating the response.' },
      ]);
    } finally {
      this.isGenerating.set(false);
    }
  }

  clearHistory() {
    this.messages.set([]);
  }
}
