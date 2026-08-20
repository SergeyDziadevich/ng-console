import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from "@env/environment";

@Injectable({
  providedIn: 'root'
})
export class IntegrationService {
  private httpClient = inject(HttpClient);

  getGoogleDriveAuthUrl(): Observable<{ url: string }> {
    return this.httpClient.get<{ url: string }>(`${environment.apiUrl}/api/integrations/google-drive/auth`);
  }

  handleGoogleDriveCallback(code: string): Observable<{ success: boolean }> {
    return this.httpClient.post<{ success: boolean }>(`${environment.apiUrl}/api/integrations/google-drive/callback`, { code });
  }

  disconnectGoogleDrive(): Observable<{ success: boolean }> {
    return this.httpClient.post<{ success: boolean }>(`${environment.apiUrl}/api/integrations/google-drive/disconnect`, {});
  }
}
