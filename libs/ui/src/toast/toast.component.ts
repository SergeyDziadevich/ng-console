import { Component, input, computed, ChangeDetectionStrategy } from "@angular/core";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-toast',
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class Toast {
  message = input('');
  type = input<'success' | 'error'>('success');

  icon = computed(() => this.type() === 'error' ? '/assets/icons/icon-error.svg' : '/assets/icons/icon-success.svg');
  bgClass = computed(() => this.type() === 'error' ? 'toast-error' : 'toast-success');
}
