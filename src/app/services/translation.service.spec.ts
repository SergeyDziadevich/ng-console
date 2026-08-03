import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TranslationService, SUPPORTED_LANGUAGES } from './translation.service';

describe('TranslationService', () => {
  let service: TranslationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        TranslationService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(TranslationService);
    httpMock = TestBed.inject(HttpTestingController);

    // Fulfill initial request triggered in constructor
    const req = httpMock.expectOne('/assets/i18n/en.json');
    req.flush({
      COMMON: { SAVE: 'Save', GREET: 'Hello {{name}}' },
      SETTINGS: { TITLE: 'Settings' },
    });
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created and default to English', () => {
    expect(service).toBeTruthy();
    expect(service.currentLang()).toBe('en');
  });

  it('should have 4 supported languages', () => {
    expect(SUPPORTED_LANGUAGES.length).toBe(4);
    expect(SUPPORTED_LANGUAGES.map((l) => l.code)).toEqual(['en', 'es', 'de', 'fr']);
  });

  it('should translate keys correctly with and without parameters', () => {
    expect(service.translate('COMMON.SAVE')).toBe('Save');
    expect(service.translate('SETTINGS.TITLE')).toBe('Settings');
    expect(service.translate('COMMON.GREET', { name: 'John' })).toBe('Hello John');
  });

  it('should return the key if translation is missing', () => {
    expect(service.translate('NON.EXISTENT.KEY')).toBe('NON.EXISTENT.KEY');
  });

  it('should switch language and update document lang attribute and localStorage', async () => {
    const promise = service.setLanguage('es');

    const req = httpMock.expectOne('/assets/i18n/es.json');
    expect(req.request.method).toBe('GET');
    req.flush({
      COMMON: { SAVE: 'Guardar' },
      SETTINGS: { TITLE: 'Configuración' },
    });

    await promise;

    expect(service.currentLang()).toBe('es');
    expect(localStorage.getItem('app-lang')).toBe('es');
    expect(document.documentElement.lang).toBe('es');
    expect(service.translate('COMMON.SAVE')).toBe('Guardar');
  });

  it('should ignore unsupported language codes', async () => {
    await service.setLanguage('invalid' as any);
    expect(service.currentLang()).toBe('en');
  });
});
