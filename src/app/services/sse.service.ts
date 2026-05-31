import { inject, Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SseService {
  private zone: NgZone = inject(NgZone);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getServerSentEvent(url: string): Observable<any> {
    return new Observable((observer) => {
      const eventSource = new EventSource(url);

      eventSource.onmessage = (event) => {
        this.zone.run(() => {
          observer.next(JSON.parse(event.data));
        });
      };

      eventSource.onerror = (error) => {
        this.zone.run(() => {
          observer.error(error);
        });
      };

      // Closes the SSE connection when unsubscribed
      return () => {
        eventSource.close();
      };
    });
  }
}
