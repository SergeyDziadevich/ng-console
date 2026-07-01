import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

import { WeatherWidget } from './weather-widget/weather-widget';
import { UsersWidget } from './users-widget/users-widget';

interface Message {
  role: 'user' | 'model';
  text: string;
}

@Component({
  selector: 'app-ai-assistant',
  imports: [FormsModule, WeatherWidget, UsersWidget],
  templateUrl: './ai-assistant.html',
  styleUrl: './ai-assistant.scss',
})
export class AiAssistant {
  private readonly http = inject(HttpClient);

  messages = signal<Message[]>([]);
  prompt = signal('');
  loading = signal(false);
  error = signal<string | null>(null);

  isWeatherMessage(text: string): boolean {
    try {
      const cleaned = text.replace(/^```(json)?\n?/i, '').replace(/\n?```$/i, '').trim();
      const parsed = JSON.parse(cleaned);
      if (parsed?.type === 'weatherWidget') return true;
      return !!(parsed && parsed.temp !== undefined && parsed.city && parsed.condition);
    } catch {
      return false;
    }
  }

  isUsersMessage(text: string): boolean {
    return (
      text.includes('Here is the list of all users:')
    );
  }

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

    // Include the full conversation history (already contains the new user message)
    const history = this.messages();

    this.http
      .post<{ text: string }>(`${environment.apiUrl}/api/ai/generate`, {
        message: text,
        messages: history.map((msg) => ({ role: msg.role, content: msg.text })),
      })
      .subscribe({
        next: (res) => {
          this.messages.update((msgs) => [...msgs, { role: 'model', text: res.text }]);
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
