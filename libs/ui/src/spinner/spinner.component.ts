import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerColor = 'blue' | 'yellow' | 'green' | 'indigo' | 'white';
export type SpinnerDirection = 'row' | 'column';

const SIZE_CLASSES: Record<SpinnerSize, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-4',
  lg: 'w-10 h-10 border-4',
  xl: 'w-12 h-12 border-4',
};

const COLOR_CLASSES: Record<SpinnerColor, string> = {
  blue: 'border-blue-500 border-t-transparent',
  yellow: 'border-yellow-500 border-t-transparent',
  green: 'border-green-500 border-t-transparent',
  indigo: 'border-indigo-500 border-t-transparent',
  white: 'border-white border-t-transparent',
};

const TEXT_COLOR_CLASSES: Record<SpinnerColor, string> = {
  blue: 'text-gray-500',
  yellow: 'text-gray-500',
  green: 'text-gray-500',
  indigo: 'text-gray-500',
  white: 'text-white',
};

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
  readonly size = input<SpinnerSize>('md');
  readonly color = input<SpinnerColor>('blue');
  readonly loadingText = input<string>('');
  readonly direction = input<SpinnerDirection>('column');

  protected readonly spinnerClass = computed(
    () => `${SIZE_CLASSES[this.size()]} ${COLOR_CLASSES[this.color()]}`,
  );

  protected readonly textClass = computed(() => TEXT_COLOR_CLASSES[this.color()]);

  protected readonly wrapperClass = computed(() => {
    const base = 'flex items-center';
    return this.direction() === 'row' ? `${base} flex-row gap-2` : `${base} flex-col gap-2`;
  });
}
