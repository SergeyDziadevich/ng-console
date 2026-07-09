import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmationDialogComponent } from './confirmation-dialog.component';
import { ComponentRef } from '@angular/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('ConfirmationDialogComponent', () => {
  let component: ConfirmationDialogComponent;
  let fixture: ComponentFixture<ConfirmationDialogComponent>;
  let componentRef: ComponentRef<ConfirmationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmationDialogComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmationDialogComponent);
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
    vi.spyOn(component.confirm, 'emit');
    const confirmButton = fixture.nativeElement.querySelector('.btn-confirm');
    confirmButton.click();
    expect(component.confirm.emit).toHaveBeenCalled();
  });

  it('should emit canceled event when cancel button is clicked', () => {
    vi.spyOn(component.canceled, 'emit');
    const cancelButton = fixture.nativeElement.querySelector('.btn-secondary');
    cancelButton.click();
    expect(component.canceled.emit).toHaveBeenCalled();
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
