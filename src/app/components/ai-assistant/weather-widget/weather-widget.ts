import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

interface WeatherData {
  city: string;
  condition: string;
  temp: number;
}

function parseWeatherData(text: string): WeatherData | null {
  try {
    const cleaned = text.replace(/^```(json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    const raw = parsed?.type === 'weatherWidget' ? parsed.data : parsed;
    if (raw && raw.temp !== undefined && raw.city && raw.condition) {
      return { city: raw.city, condition: raw.condition, temp: raw.temp };
    }
    return null;
  } catch {
    return null;
  }
}

@Component({
  selector: 'app-weather-widget',
  templateUrl: './weather-widget.html',
  styleUrls: ['./weather-widget.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeatherWidget {
  readonly text = input('');

  protected readonly weatherData = computed(() => parseWeatherData(this.text()));

  protected readonly isWeather = computed(() => this.weatherData() !== null);
  protected readonly city = computed(() => this.weatherData()?.city ?? 'Unknown');
  protected readonly condition = computed(() => this.weatherData()?.condition ?? 'Unknown');
  protected readonly temperature = computed(() => `${this.weatherData()?.temp ?? 0}°C`);

  protected getWeatherIcon(): string {
    const cond = this.condition().toLowerCase();
    if (cond.includes('cloudy')) return '☁️';
    if (cond.includes('rain')) return '🌧️';
    if (cond.includes('sun') || cond.includes('clear')) return '☀️';
    if (cond.includes('snow')) return '❄️';
    return '⛅';
  }
}
