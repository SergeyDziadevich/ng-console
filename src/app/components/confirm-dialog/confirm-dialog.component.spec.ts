import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { ComponentRef } from '@angular/core';
import { vi } from 'vitest';

describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let componentRef: ComponentRef<ConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;

    // Set required input
    componentRef.setInput('title', 'Test Title');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit confirm event when confirm button is clicked', () => {
    vi.spyOn(component.confirmAction, 'emit');
    const confirmButton = fixture.nativeElement.querySelector('.btn-confirm');
    confirmButton.click();
    expect(component.confirmAction.emit).toHaveBeenCalled();
  });

  it('should emit cancel event when cancel button is clicked', () => {
    vi.spyOn(component.cancelAction, 'emit');
    const cancelButton = fixture.nativeElement.querySelector('.btn-secondary');
    cancelButton.click();
    expect(component.cancelAction.emit).toHaveBeenCalled();
  });

  it('should render correct class for danger type', () => {
    componentRef.setInput('type', 'danger');
    fixture.detectChanges();
    const confirmButton = fixture.nativeElement.querySelector('.btn-confirm');
    expect(confirmButton.classList.contains('danger')).toBe(true);
    expect(confirmButton.classList.contains('warning')).toBe(false);
  });

  it('should render correct class for warning type', () => {
    componentRef.setInput('type', 'warning');
    fixture.detectChanges();
    const confirmButton = fixture.nativeElement.querySelector('.btn-confirm');
    expect(confirmButton.classList.contains('warning')).toBe(true);
    expect(confirmButton.classList.contains('danger')).toBe(false);
  });
});
