import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentRef } from '@angular/core';

import { WeatherWidget } from './weather-widget';

describe('WeatherWidget', () => {
  let component: WeatherWidget;
  let componentRef: ComponentRef<WeatherWidget>;
  let fixture: ComponentFixture<WeatherWidget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeatherWidget],
    }).compileComponents();

    fixture = TestBed.createComponent(WeatherWidget);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('parseWeatherData (via weatherData signal)', () => {
    it('should parse valid json string', () => {
      componentRef.setInput('text', JSON.stringify({ city: 'Paris', condition: 'Rain', temp: 15 }));
      fixture.detectChanges();

      // We can check the protected signals via casting to any in tests, or we can check the derived public state if there was any.
      // Since it's protected, we cast:
      const data = component['weatherData']();
      expect(data).toEqual({ city: 'Paris', condition: 'Rain', temp: 15 });
    });

    it('should handle markdown block', () => {
      componentRef.setInput(
        'text',
        '```\n{"city": "Tokyo", "condition": "Cloudy", "temp": 18}\n```',
      );
      fixture.detectChanges();

      const data = component['weatherData']();
      expect(data).toEqual({ city: 'Tokyo', condition: 'Cloudy', temp: 18 });
    });

    it('should handle weatherWidget type payload', () => {
      componentRef.setInput(
        'text',
        JSON.stringify({
          type: 'weatherWidget',
          data: { city: 'NY', condition: 'Sunny', temp: 25 },
        }),
      );
      fixture.detectChanges();

      const data = component['weatherData']();
      expect(data).toEqual({ city: 'NY', condition: 'Sunny', temp: 25 });
    });

    it('should return null for invalid json', () => {
      componentRef.setInput('text', 'invalid text');
      fixture.detectChanges();

      const data = component['weatherData']();
      expect(data).toBeNull();
    });

    it('should return null for missing fields', () => {
      componentRef.setInput('text', JSON.stringify({ city: 'NY', temp: 25 })); // missing condition
      fixture.detectChanges();

      const data = component['weatherData']();
      expect(data).toBeNull();
    });
  });
});
