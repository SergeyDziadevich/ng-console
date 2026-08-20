import { Component, input, output, ChangeDetectionStrategy } from "@angular/core";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
  })
export class ConfirmDialogComponent {
  title = input.required<string>();
  text = input<string>();
  type = input<'warning' | 'danger'>('danger');
  confirmText = input<string>('Confirm');
  cancelText = input<string>('Cancel');

  confirmAction = output<void>();
  cancelAction = output<void>();
}
