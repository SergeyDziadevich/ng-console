import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-weather-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weather-widget.html',
  styleUrls: ['./weather-widget.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeatherWidget implements OnInit {
  @Input() text: string = '';

  city: string = 'Unknown';
  condition: string = 'Unknown';
  temperature: string = '0°C';
  isWeather: boolean = false;

  ngOnInit(): void {
    this.parseWeather();
  }

  parseWeather() {
    // Example: "The weather in Warsaw today is partly cloudy with a temperature of 23°C."
    const match = this.text.match(/weather in ([\w\s]+) today is ([\w\s]+) with a temperature of (\d+°C)/i);
    if (match) {
      this.isWeather = true;
      this.city = match[1].trim();
      this.condition = match[2].trim();
      this.temperature = match[3].trim();
    }
  }

  getWeatherIcon(): string {
    const condition = this.condition.toLowerCase();
    if (condition.includes('cloudy')) {
      return '☁️';
    } else if (condition.includes('rain')) {
      return '🌧️';
    } else if (condition.includes('sun') || condition.includes('clear')) {
      return '☀️';
    } else if (condition.includes('snow')) {
      return '❄️';
    }
    return '⛅';
  }
}
