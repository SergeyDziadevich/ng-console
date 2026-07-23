import { Injectable, computed, signal } from '@angular/core';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themeSignal = signal<Theme>('system');
  private systemThemeSignal = signal<'light' | 'dark'>(this.getSystemTheme());

  // Computed signal that resolves 'system' to the actual active mode ('light' | 'dark')
  readonly activeThemeMode = computed(() => {
    const theme = this.themeSignal();
    if (theme === 'system') {
      return this.systemThemeSignal();
    }
    return theme;
  });

  readonly currentTheme = this.themeSignal.asReadonly();

  constructor() {
    this.initializeTheme();

    // Listen to system theme changes if set to 'system'
    if (typeof window !== 'undefined') {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        const newSystemTheme = e.matches ? 'dark' : 'light';
        this.systemThemeSignal.set(newSystemTheme);
        if (this.themeSignal() === 'system') {
          this.applyThemeToDocument('system');
        }
      });
    }
  }

  private initializeTheme() {
    const savedTheme = localStorage.getItem('app-theme') as Theme | null;
    const initialTheme = savedTheme || 'system';
    this.setTheme(initialTheme);
  }

  setTheme(theme: Theme) {
    this.themeSignal.set(theme);
    localStorage.setItem('app-theme', theme);
    this.applyThemeToDocument(theme);
  }

  private applyThemeToDocument(theme: Theme) {
    const isDark = theme === 'dark' || (theme === 'system' && this.systemThemeSignal() === 'dark');

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  private getSystemTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
