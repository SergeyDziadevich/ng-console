import { Directive, ElementRef, inject, output } from '@angular/core';

@Directive({
  selector: '[appClickOutside]',
  host: {
    '(document:click)': 'onClick($event)',
  },
})
export class ClickOutsideDirective {
  readonly appClickOutside = output<Event>();

  private readonly elementRef = inject(ElementRef);

  onClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.appClickOutside.emit(event);
    }
  }
}
