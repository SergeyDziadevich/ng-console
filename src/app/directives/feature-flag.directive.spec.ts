import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { FeatureFlagDirective } from './feature-flag.directive';
import { FeatureFlagService } from '../services/feature-flag.service';

@Component({
  selector: 'app-test-feature-flag',
  imports: [FeatureFlagDirective],
  template: `<div id="feature-content" *appFeatureFlag="'newDashboard'">New Dashboard Feature</div>`,
})
class TestComponent {}

describe('FeatureFlagDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let mockFeatureFlagService: { getFlagSignal: Mock };
  let flagSignal: ReturnType<typeof signal<boolean>>;

  beforeEach(async () => {
    flagSignal = signal(false);
    mockFeatureFlagService = {
      getFlagSignal: vi.fn().mockReturnValue(flagSignal),
    };

    await TestBed.configureTestingModule({
      imports: [TestComponent],
      providers: [{ provide: FeatureFlagService, useValue: mockFeatureFlagService }],
    }).compileComponents();
  });

  it('should not render content when feature flag is disabled', () => {
    fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();

    const element = fixture.debugElement.query(By.css('#feature-content'));
    expect(element).toBeNull();
    expect(mockFeatureFlagService.getFlagSignal).toHaveBeenCalledWith('newDashboard');
  });

  it('should render content when feature flag is enabled', () => {
    flagSignal.set(true);
    fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();

    const element = fixture.debugElement.query(By.css('#feature-content'));
    expect(element).not.toBeNull();
    expect(element.nativeElement.textContent).toContain('New Dashboard Feature');
  });

  it('should reactively toggle content when feature flag status changes', () => {
    fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('#feature-content'))).toBeNull();

    flagSignal.set(true);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('#feature-content'))).not.toBeNull();

    flagSignal.set(false);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('#feature-content'))).toBeNull();
  });
});
