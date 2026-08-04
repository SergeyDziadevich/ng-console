import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TranslatePipe } from './translate.pipe';
import { TranslationService } from '@app/services/translation.service';

describe('TranslatePipe', () => {
  let pipe: TranslatePipe;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [TranslatePipe],
      providers: [
        TranslationService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    pipe = TestBed.runInInjectionContext(() => new TranslatePipe());

    const req = httpMock.expectOne('/assets/i18n/en.json');
    req.flush({
      COMMON: { SAVE: 'Save', GREET: 'Hello {{name}}' },
    });
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should transform key using TranslationService', () => {
    expect(pipe.transform('COMMON.SAVE')).toBe('Save');
    expect(pipe.transform('COMMON.GREET', { name: 'Alice' })).toBe('Hello Alice');
  });

  it('should return original key when not found', () => {
    expect(pipe.transform('UNKNOWN.KEY')).toBe('UNKNOWN.KEY');
  });
});
