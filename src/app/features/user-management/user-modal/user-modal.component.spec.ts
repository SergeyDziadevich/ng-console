import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserModal } from "./user-modal.component";
import { ComponentRef } from '@angular/core';

describe('UserModal', () => {
  let component: UserModal;
  let fixture: ComponentFixture<UserModal>;
  let componentRef: ComponentRef<UserModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserModal],
    }).compileComponents();

    fixture = TestBed.createComponent(UserModal);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('title', 'Test Title');
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit submitted when handleSubmit is called', () => {
    const emitSpy = vi.spyOn(component.submitted, 'emit');
    const mockEvent = new Event('submit');
    component.handleSubmit(mockEvent);
    expect(emitSpy).toHaveBeenCalled();
  });

  it('should emit closeModal when closeModal is triggered', () => {
    const emitSpy = vi.spyOn(component.closeModal, 'emit');
    component.closeModal.emit();
    expect(emitSpy).toHaveBeenCalled();
  });
});
