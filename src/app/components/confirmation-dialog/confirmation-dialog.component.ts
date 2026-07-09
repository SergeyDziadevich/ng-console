import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationDialogComponent {
  title = input.required<string>();
  text = input<string>();
  type = input<'warning' | 'danger'>('danger');
  confirmText = input<string>('Confirm');
  cancelText = input<string>('Cancel');

  confirm = output<void>();
  canceled = output<void>();
}
