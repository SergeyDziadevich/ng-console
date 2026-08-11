import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of, tap } from 'rxjs';

export interface AppConfig {
  googleClientId: string;
}

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly http = inject(HttpClient);
  private readonly configSignal = signal<AppConfig | null>(null);

  readonly config = this.configSignal.asReadonly();

  loadConfig(): Observable<AppConfig | null> {
    return this.http.get<AppConfig>('/assets/config.json').pipe(
      tap((cfg) => this.configSignal.set(cfg)),
      catchError(() => {
        // Fallback for local development if assets/config.json is missing
        this.configSignal.set({ googleClientId: '' });
        return of(null);
      })
    );
  }
}
