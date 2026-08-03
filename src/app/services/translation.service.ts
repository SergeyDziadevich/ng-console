import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { loadTranslations } from '@angular/localize';

export type SupportedLanguage = 'en' | 'es' | 'de' | 'fr';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
];

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private readonly http = inject(HttpClient);

  private readonly langSignal = signal<SupportedLanguage>('en');
  readonly currentLang = this.langSignal.asReadonly();

  private readonly translationsSignal = signal<Record<string, unknown>>({});
  readonly translations = this.translationsSignal.asReadonly();

  private readonly isLoadingSignal = signal<boolean>(false);
  readonly isLoading = this.isLoadingSignal.asReadonly();

  constructor() {
    this.initLanguage();
  }

  private initLanguage(): void {
    const savedLang = localStorage.getItem('app-lang') as SupportedLanguage;
    const validLang: SupportedLanguage = ['en', 'es', 'de', 'fr'].includes(savedLang)
      ? savedLang
      : 'en';
    this.setLanguage(validLang);
  }

  async setLanguage(lang: SupportedLanguage): Promise<void> {
    if (!['en', 'es', 'de', 'fr'].includes(lang)) {
      return;
    }
    this.langSignal.set(lang);
    localStorage.setItem('app-lang', lang);
    document.documentElement.lang = lang;

    this.isLoadingSignal.set(true);
    try {
      const data = await firstValueFrom(
        this.http.get<Record<string, unknown>>(`/assets/i18n/${lang}.json`)
      );
      const flatMap = this.flattenObject(data || {});
      this.translationsSignal.set(data || {});
      loadTranslations(flatMap);
    } catch {
      // Fallback to empty translations or keep current if error
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  private flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
    const result: Record<string, string> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        const prefixedKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null) {
          Object.assign(result, this.flattenObject(value as Record<string, unknown>, prefixedKey));
        } else if (typeof value === 'string') {
          result[prefixedKey] = value;
        }
      }
    }
    return result;
  }

  translate(key: string, params?: Record<string, string | number>): string {
    if (!key) return '';
    const keys = key.split('.');
    let current: unknown = this.translationsSignal();

    for (const k of keys) {
      if (current && typeof current === 'object' && k in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[k];
      } else {
        return key; // return key if translation missing
      }
    }

    if (typeof current !== 'string') {
      return key;
    }

    let result = current;
    if (params) {
      Object.keys(params).forEach((paramKey) => {
        const value = params[paramKey];
        result = result.replace(new RegExp(`{{\\s*${paramKey}\\s*}}`, 'g'), String(value));
        result = result.replace(new RegExp(`{\\s*${paramKey}\\s*}`, 'g'), String(value));
      });
    }

    return result;
  }
}
