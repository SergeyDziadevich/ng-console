import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { SseService } from '../../services/sse.service';
import { Subscription } from 'rxjs';
import { DatePipe, JsonPipe } from '@angular/common';

@Component({
  selector: 'app-notifications',
  imports: [DatePipe, JsonPipe],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss',
})
export class Notifications implements OnInit, OnDestroy {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages = signal([] as any[]);
  private sseSubscription!: Subscription;

  private sseService: SseService = inject(SseService);

  ngOnInit(): void {
    const backendSseUrl = 'http://localhost:3000/api/events/stream';

    this.sseSubscription = this.sseService.getServerSentEvent(backendSseUrl).subscribe({
      next: (data) => {
        this.messages.update((prevMessages) => [...prevMessages, data]);
      },
      error: (err) => {
        console.error('SSE Error encountered: ', err);
      },
    });
  }

  ngOnDestroy(): void {
    // This automatically triggers the eventSource.close() setup in the service
    if (this.sseSubscription) {
      this.sseSubscription.unsubscribe();
    }
  }
}
