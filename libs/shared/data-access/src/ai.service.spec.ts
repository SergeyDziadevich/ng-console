import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AiService, ChatMessage } from './ai.service';
import { environment } from "@env/environment";
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('AiService', () => {
  let service: AiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AiService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created with initial state', () => {
    expect(service).toBeTruthy();
    expect(service.messages()).toEqual([]);
    expect(service.isGenerating()).toBe(false);
  });

  it('should clear history', () => {
    service.messages.set([{ role: 'user', content: 'test' }]);
    service.clearHistory();
    expect(service.messages()).toEqual([]);
  });

  describe('command palette state', () => {
    it('should toggle command palette open and closed', () => {
      expect(service.isCommandPaletteOpen()).toBe(false);
      
      service.toggleCommandPalette();
      expect(service.isCommandPaletteOpen()).toBe(true);
      
      service.toggleCommandPalette();
      expect(service.isCommandPaletteOpen()).toBe(false);
    });

    it('should close command palette explicitly', () => {
      service.isCommandPaletteOpen.set(true);
      expect(service.isCommandPaletteOpen()).toBe(true);
      
      service.closeCommandPalette();
      expect(service.isCommandPaletteOpen()).toBe(false);
    });
  });

  describe('generate', () => {
    it('should handle successful response', async () => {
      const message = 'Hello';
      const responseText = 'Hi there!';

      const promise = service.generate(message);

      // Check optimistic update and generating state
      expect(service.isGenerating()).toBe(true);
      expect(service.messages().length).toBe(1);
      expect(service.messages()[0]).toEqual({ role: 'user', content: 'Hello' });

      // Handle HTTP request
      const req = httpTestingController.expectOne(`${environment.apiUrl}/api/ai/generate`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ message, messages: [] });

      req.flush({ text: responseText });

      await promise;

      // Check final state
      expect(service.isGenerating()).toBe(false);
      expect(service.messages().length).toBe(2);
      expect(service.messages()[1]).toEqual({ role: 'model', content: responseText });
    });

    it('should include history in payload', async () => {
      const history: ChatMessage[] = [
        { role: 'user', content: 'prev' },
        { role: 'model', content: 'resp' },
      ];
      service.messages.set(history);

      const promise = service.generate('Next');

      const req = httpTestingController.expectOne(`${environment.apiUrl}/api/ai/generate`);
      expect(req.request.body).toEqual({ message: 'Next', messages: history });
      req.flush({ text: 'Answer' });

      await promise;
    });

    it('should handle error response', async () => {
      const message = 'Hello error';

      const promise = service.generate(message);

      const req = httpTestingController.expectOne(`${environment.apiUrl}/api/ai/generate`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      await promise;

      expect(service.isGenerating()).toBe(false);
      expect(service.messages().length).toBe(2);
      expect(service.messages()[1].role).toBe('model');
      expect(service.messages()[1].content).toContain('An error occurred');
    });
  });
});
