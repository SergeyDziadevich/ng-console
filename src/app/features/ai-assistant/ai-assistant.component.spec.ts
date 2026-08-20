import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AiAssistant } from "./ai-assistant.component";

describe('AiAssistant', () => {
  let component: AiAssistant;
  let fixture: ComponentFixture<AiAssistant>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiAssistant],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(AiAssistant);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('isWeatherMessage', () => {
    it('should return true for valid weather JSON string', () => {
      const json = JSON.stringify({ temp: 20, city: 'London', condition: 'Sunny' });
      expect(component.isWeatherMessage(json)).toBe(true);
    });

    it('should return true for weather widget type', () => {
      const json = JSON.stringify({
        type: 'weatherWidget',
        data: { temp: 20, city: 'London', condition: 'Sunny' },
      });
      expect(component.isWeatherMessage(json)).toBe(true);
    });

    it('should handle markdown block', () => {
      const json = '```json\n{"temp": 20, "city": "London", "condition": "Sunny"}\n```';
      expect(component.isWeatherMessage(json)).toBe(true);
    });

    it('should return false for invalid JSON', () => {
      expect(component.isWeatherMessage('hello world')).toBe(false);
    });

    it('should return false for missing fields', () => {
      const json = JSON.stringify({ temp: 20, city: 'London' });
      expect(component.isWeatherMessage(json)).toBe(false);
    });
  });

  describe('isUsersMessage', () => {
    it('should return true if message contains the trigger string', () => {
      expect(component.isUsersMessage('Here is the list of all users:\n* **User1**')).toBe(true);
    });

    it('should return false if message does not contain the trigger string', () => {
      expect(component.isUsersMessage('Here are the users')).toBe(false);
    });
  });

  describe('clearChat', () => {
    it('should clear messages and error state', () => {
      component.messages.set([{ role: 'user', text: 'Hello' }]);
      component.error.set('Something went wrong');

      component.clearChat();

      expect(component.messages()).toEqual([]);
      expect(component.error()).toBeNull();
    });
  });

  describe('useSuggestion', () => {
    it('should set prompt to suggestion text', () => {
      component.useSuggestion('Here is the list of all users:');
      // prompt is cleared when send() runs, but message is updated
      expect(component.messages().length).toBe(1);
      expect(component.messages()[0].text).toBe('Here is the list of all users:');
    });
  });
});

