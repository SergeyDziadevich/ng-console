import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ClickOutsideDirective } from './click-outside.directive';

@Component({
  template: `
    <div class="outside">Outside Element</div>
    <div class="inside" appClickOutside (appClickOutside)="onOutsideClick()">
      Inside Element
    </div>
  `,
  imports: [ClickOutsideDirective]
})
class TestComponent {
  clickedOutside = false;
  onOutsideClick() {
    this.clickedOutside = true;
  }
}

describe('ClickOutsideDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let outsideElement: DebugElement;
  let insideElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    outsideElement = fixture.debugElement.query(By.css('.outside'));
    insideElement = fixture.debugElement.query(By.css('.inside'));
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should emit appClickOutside when clicking outside the element', () => {
    outsideElement.nativeElement.click();
    expect(component.clickedOutside).toBe(true);
  });

  it('should NOT emit appClickOutside when clicking inside the element', () => {
    insideElement.nativeElement.click();
    expect(component.clickedOutside).toBe(false);
  });
});
