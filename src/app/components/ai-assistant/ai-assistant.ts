import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

@Component({
  selector: 'app-ai-assistant',
  imports: [FormsModule],
  templateUrl: './ai-assistant.html',
  styleUrl: './ai-assistant.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiAssistant {
  private readonly http = inject(HttpClient);

  messages = signal<Message[]>([]);
  prompt = signal('');
  loading = signal(false);
  error = signal<string | null>(null);

  updatePrompt(value: string) {
    this.prompt.set(value);
  }

  async send() {
    const text = this.prompt().trim();
    if (!text || this.loading()) return;

    this.messages.update((msgs) => [...msgs, { role: 'user', text }]);
    this.prompt.set('');
    this.loading.set(true);
    this.error.set(null);

    this.http
      .post<{ text: string }>(`${environment.apiUrl}/api/ai/generate`, { message: text })
      .subscribe({
        next: (res) => {
          this.messages.update((msgs) => [...msgs, { role: 'assistant', text: res.text }]);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to get a response. Please try again.');
          this.loading.set(false);
        },
      });
  }

  handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }
}
