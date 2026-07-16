import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach } from 'vitest';
import { SpinnerComponent } from './spinner.component';
import { Color, Direction, Size } from '../constants';

describe('SpinnerComponent', () => {
  let component: SpinnerComponent;
  let fixture: ComponentFixture<SpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpinnerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SpinnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── Default inputs ───────────────────────────────────────────────────────────

  describe('defaults', () => {
    it('should default size to "md"', () => {
      expect(component.size()).toBe('md');
    });

    it('should default color to "blue"', () => {
      expect(component.color()).toBe('blue');
    });

    it('should default loadingText to empty string', () => {
      expect(component.loadingText()).toBe('');
    });

    it('should default direction to "column"', () => {
      expect(component.direction()).toBe('column');
    });
  });

  // ─── spinnerClass computed ────────────────────────────────────────────────────

  describe('spinnerClass()', () => {
    it.each<[Size, string]>([
      ['sm', 'w-4 h-4 border-2'],
      ['md', 'w-8 h-8 border-4'],
      ['lg', 'w-10 h-10 border-4'],
      ['xl', 'w-12 h-12 border-4'],
    ])('size "%s" includes size classes "%s"', (size, expectedSize) => {
      fixture.componentRef.setInput('size', size);
      fixture.detectChanges();
      expect(component.spinnerClass()).toContain(expectedSize);
    });

    it.each<[Color, string]>([
      ['blue', 'border-blue-500 border-t-transparent'],
      ['yellow', 'border-yellow-500 border-t-transparent'],
      ['green', 'border-green-500 border-t-transparent'],
      ['indigo', 'border-indigo-500 border-t-transparent'],
      ['white', 'border-white border-t-transparent'],
    ])('color "%s" includes color classes "%s"', (color, expectedColor) => {
      fixture.componentRef.setInput('color', color);
      fixture.detectChanges();
      expect(component.spinnerClass()).toContain(expectedColor);
    });

    it('should combine size and color classes', () => {
      fixture.componentRef.setInput('size', 'lg');
      fixture.componentRef.setInput('color', 'green');
      fixture.detectChanges();
      expect(component.spinnerClass()).toBe(
        'w-10 h-10 border-4 border-green-500 border-t-transparent',
      );
    });
  });

  // ─── textClass computed ───────────────────────────────────────────────────────

  describe('textClass()', () => {
    it.each<[Color, string]>([
      ['blue', 'text-gray-500'],
      ['yellow', 'text-gray-500'],
      ['green', 'text-gray-500'],
      ['indigo', 'text-gray-500'],
      ['white', 'text-white'],
    ])('color "%s" maps to text class "%s"', (color, expectedClass) => {
      fixture.componentRef.setInput('color', color);
      fixture.detectChanges();
      expect(component.textClass()).toBe(expectedClass);
    });
  });

  // ─── wrapperClass computed ────────────────────────────────────────────────────

  describe('wrapperClass()', () => {
    it.each<[Direction, string]>([
      ['row', 'flex items-center flex-row gap-2'],
      ['column', 'flex items-center flex-col gap-2'],
    ])('direction "%s" produces wrapper class "%s"', (direction, expected) => {
      fixture.componentRef.setInput('direction', direction);
      fixture.detectChanges();
      expect(component.wrapperClass()).toBe(expected);
    });
  });

  // ─── Template rendering ───────────────────────────────────────────────────────

  describe('template', () => {
    it('should render the spinner element with aria-hidden', () => {
      const spinner = fixture.debugElement.query(
        By.css('span[aria-hidden="true"]'),
      );
      expect(spinner).toBeTruthy();
      expect(spinner.nativeElement.getAttribute('aria-hidden')).toBe('true');
    });

    it('should apply animate-spin class to the spinner element', () => {
      const spinner = fixture.debugElement.query(
        By.css('span[aria-hidden="true"]'),
      );
      expect(spinner.nativeElement.classList).toContain('animate-spin');
    });

    it('should NOT render loadingText span when loadingText is empty', () => {
      const textSpan = fixture.debugElement.query(By.css('span.font-medium'));
      expect(textSpan).toBeNull();
    });

    it('should render loadingText span when loadingText is set', () => {
      fixture.componentRef.setInput('loadingText', 'Loading…');
      fixture.detectChanges();
      const textSpan = fixture.debugElement.query(By.css('span.font-medium'));
      expect(textSpan).toBeTruthy();
      expect(textSpan.nativeElement.textContent.trim()).toBe('Loading…');
    });

    it('should remove loadingText span when loadingText is cleared', () => {
      fixture.componentRef.setInput('loadingText', 'Loading…');
      fixture.detectChanges();
      expect(
        fixture.debugElement.query(By.css('span.font-medium')),
      ).toBeTruthy();

      fixture.componentRef.setInput('loadingText', '');
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('span.font-medium'))).toBeNull();
    });

    it('should apply wrapperClass to the outer span', () => {
      fixture.componentRef.setInput('direction', 'row');
      fixture.detectChanges();
      const wrapper = fixture.debugElement.query(By.css('span.flex'));
      expect(wrapper.nativeElement.classList).toContain('flex-row');
    });

    it('should apply spinnerClass to the spinner span', () => {
      fixture.componentRef.setInput('size', 'xl');
      fixture.componentRef.setInput('color', 'yellow');
      fixture.detectChanges();
      const spinner = fixture.debugElement.query(
        By.css('span[aria-hidden="true"]'),
      );
      expect(spinner.nativeElement.classList).toContain('w-12');
      expect(spinner.nativeElement.classList).toContain('border-yellow-500');
    });

    it('should apply textClass to the loadingText span', () => {
      fixture.componentRef.setInput('loadingText', 'Please wait');
      fixture.componentRef.setInput('color', 'white');
      fixture.detectChanges();
      const textSpan = fixture.debugElement.query(By.css('span.font-medium'));
      expect(textSpan.nativeElement.classList).toContain('text-white');
    });
  });
});
