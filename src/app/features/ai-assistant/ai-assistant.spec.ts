import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AiAssistant } from './ai-assistant';

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
});
