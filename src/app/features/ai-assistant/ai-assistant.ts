import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideBot,
  lucideUser,
  lucideSend,
  lucideSparkles,
  lucideTrash2,
  lucideCopy,
  lucideCheck,
  lucideCloudSun,
  lucideUsers,
  lucideFileText,
  lucideArrowDown,
  lucideRotateCcw,
  lucideLightbulb,
  lucideCornerDownLeft,
  lucideLoader2,
} from '@ng-icons/lucide';
import { environment } from '../../../environments/environment';

import { WeatherWidget } from './weather-widget/weather-widget';
import { UsersWidget } from './users-widget/users-widget';
import { DocumentWidget } from './document-widget/document-widget';

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp?: Date;
}

export interface Suggestion {
  icon: string;
  title: string;
  subtitle: string;
  prompt: string;
}

@Component({
  selector: 'app-ai-assistant',
  imports: [FormsModule, NgIconComponent, WeatherWidget, UsersWidget, DocumentWidget],
  providers: [
    provideIcons({
      lucideBot,
      lucideUser,
      lucideSend,
      lucideSparkles,
      lucideTrash2,
      lucideCopy,
      lucideCheck,
      lucideCloudSun,
      lucideUsers,
      lucideFileText,
      lucideArrowDown,
      lucideRotateCcw,
      lucideLightbulb,
      lucideCornerDownLeft,
      lucideLoader2,
    }),
  ],
  templateUrl: './ai-assistant.html',
  styleUrl: './ai-assistant.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiAssistant {
  private readonly http = inject(HttpClient);

  readonly chatContainer = viewChild<ElementRef<HTMLDivElement>>('chatContainer');

  messages = signal<Message[]>([]);
  prompt = signal('');
  loading = signal(false);
  error = signal<string | null>(null);
  copiedIndex = signal<number | null>(null);
  showScrollBottom = signal(false);

  readonly suggestions: Suggestion[] = [
    {
      icon: 'lucideUsers',
      title: 'List Registered Users',
      subtitle: 'View active accounts and status',
      prompt: 'Here is the list of all users:',
    },
    {
      icon: 'lucideCloudSun',
      title: 'Check Weather Forecast',
      subtitle: 'Get current conditions & forecast',
      prompt: 'What is the weather in Berlin?',
    },
    {
      icon: 'lucideFileText',
      title: 'Search System Documents',
      subtitle: 'Find uploaded specs and guides',
      prompt: 'Search through uploaded documents for security policy',
    },
  ];

  isWeatherMessage(text: string): boolean {
    try {
      const cleaned = text
        .replace(/^```(json)?\n?/i, '')
        .replace(/\n?```$/i, '')
        .trim();
      const parsed = JSON.parse(cleaned);
      if (parsed?.type === 'weatherWidget') return true;
      return !!(parsed && parsed.temp !== undefined && parsed.city && parsed.condition);
    } catch {
      return false;
    }
  }

  isUsersMessage(text: string): boolean {
    return text.includes('Here is the list of all users:');
  }

  isDocumentMessage(text: string): boolean {
    try {
      const match = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
      const jsonStr = match ? match[1] : text.replace(/^```(json)?\n?/i, '').replace(/\n?```$/i, '').trim();
      const parsed = JSON.parse(jsonStr);
      return parsed?.type === 'documentWidget';
    } catch {
      return false;
    }
  }

  updatePrompt(value: string) {
    this.prompt.set(value);
  }

  useSuggestion(suggestionPrompt: string) {
    this.prompt.set(suggestionPrompt);
    this.send();
  }

  clearChat() {
    this.messages.set([]);
    this.error.set(null);
  }

  async copyMessageText(text: string, index: number) {
    try {
      await navigator.clipboard.writeText(text);
      this.copiedIndex.set(index);
      setTimeout(() => {
        if (this.copiedIndex() === index) {
          this.copiedIndex.set(null);
        }
      }, 2000);
    } catch {
      // Ignore clipboard error
    }
  }

  onScroll(event: Event) {
    const target = event.target as HTMLDivElement;
    if (!target) return;
    const isUp = target.scrollHeight - target.scrollTop - target.clientHeight > 120;
    this.showScrollBottom.set(isUp);
  }

  scrollToBottom() {
    const el = this.chatContainer()?.nativeElement;
    if (el) {
      if (typeof el.scrollTo === 'function') {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      } else {
        el.scrollTop = el.scrollHeight;
      }
    }
  }

  formatTime(date?: Date): string {
    const d = date || new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  async send() {
    const text = this.prompt().trim();
    if (!text || this.loading()) return;

    const userMsg: Message = { role: 'user', text, timestamp: new Date() };
    this.messages.update((msgs) => [...msgs, userMsg]);
    this.prompt.set('');
    this.loading.set(true);
    this.error.set(null);

    setTimeout(() => this.scrollToBottom(), 50);

    const history = this.messages();

    this.http
      .post<{ text: string }>(`${environment.apiUrl}/api/ai/generate`, {
        message: text,
        messages: history.map((msg) => ({ role: msg.role, content: msg.text })),
      })
      .subscribe({
        next: (res) => {
          const modelMsg: Message = { role: 'model', text: res.text, timestamp: new Date() };
          this.messages.update((msgs) => [...msgs, modelMsg]);
          this.loading.set(false);
          setTimeout(() => this.scrollToBottom(), 50);
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

