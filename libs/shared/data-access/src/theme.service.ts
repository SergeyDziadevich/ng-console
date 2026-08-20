import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private themeSignal = signal<Theme>('light');

  readonly currentTheme = this.themeSignal.asReadonly();

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme() {
    const savedTheme = localStorage.getItem('app-theme');
    const initialTheme = (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : 'light';
    this.setTheme(initialTheme);
  }

  setTheme(theme: Theme) {
    this.themeSignal.set(theme);
    localStorage.setItem('app-theme', theme);
    this.applyThemeToDocument(theme);
  }

  private applyThemeToDocument(theme: Theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}
