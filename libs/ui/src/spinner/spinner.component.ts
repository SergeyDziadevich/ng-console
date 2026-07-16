import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Color, COLOR_CLASSES, Direction, Size, SIZE_CLASSES, TEXT_COLOR_CLASSES } from '../constants';

@Component({
  selector: 'app-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="wrapperClass()">
      <span
        class="rounded-full animate-spin shrink-0"
        [class]="spinnerClass()"
        aria-hidden="true"
      ></span>
      @if (loadingText()) {
        <span class="font-medium" [class]="textClass()">{{ loadingText() }}</span>
      }
    </span>
  `,
})
export class SpinnerComponent {
  readonly size = input<Size>('md');
  readonly color = input<Color>('blue');
  readonly loadingText = input<string>('');
  readonly direction = input<Direction>('column');

  readonly spinnerClass = computed(
    () => `${SIZE_CLASSES[this.size()]} ${COLOR_CLASSES[this.color()]}`,
  );

  readonly textClass = computed(() => TEXT_COLOR_CLASSES[this.color()]);

  readonly wrapperClass = computed(() => {
    const base = 'flex items-center';
    return this.direction() === 'row' ? `${base} flex-row gap-2` : `${base} flex-col gap-2`;
  });
}
