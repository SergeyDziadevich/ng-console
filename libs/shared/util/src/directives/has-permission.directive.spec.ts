import { Component, signal, ChangeDetectionStrategy } from "@angular/core";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HasPermissionDirective } from './has-permission.directive';
import { PermissionsService } from "@ng-console/shared/data-access";
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-test',
  imports: [HasPermissionDirective],
  template: ` <div id="target-element" *appHasPermission="'CREATE_USER'">Visible if allowed</div> `,
})
class TestComponent {}

describe('HasPermissionDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let mockPermissionsService: { hasPermission: Mock };
  let hasPermissionSignal: ReturnType<typeof signal<boolean>>;

  beforeEach(async () => {
    hasPermissionSignal = signal(false);
    mockPermissionsService = {
      hasPermission: vi.fn().mockReturnValue(hasPermissionSignal),
    };

    await TestBed.configureTestingModule({
      imports: [TestComponent],
      providers: [{ provide: PermissionsService, useValue: mockPermissionsService }],
    }).compileComponents();
  });

  it('should not render element if permission is missing', () => {
    fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();

    const element = fixture.debugElement.query(By.css('#target-element'));
    expect(element).toBeNull();
    expect(mockPermissionsService.hasPermission).toHaveBeenCalledWith('CREATE_USER');
  });

  it('should render element if permission is granted', () => {
    hasPermissionSignal.set(true);
    fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();

    const element = fixture.debugElement.query(By.css('#target-element'));
    expect(element).not.toBeNull();
    expect(element.nativeElement.textContent).toContain('Visible if allowed');
  });

  it('should reactively show and hide element when permission changes', () => {
    fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('#target-element'))).toBeNull();

    hasPermissionSignal.set(true);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('#target-element'))).not.toBeNull();

    hasPermissionSignal.set(false);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('#target-element'))).toBeNull();
  });
});
