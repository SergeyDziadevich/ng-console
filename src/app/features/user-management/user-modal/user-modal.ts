import { Component, input, output } from '@angular/core';

import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-user-modal',
  imports: [TranslatePipe],
  templateUrl: './user-modal.html',
  styleUrl: './user-modal.scss',
})
export class UserModal {
  title = input.required<string>();
  submitLabel = input<string>('Submit');
  submitDisabled = input<boolean>(false);
  error = input<string | null>(null);

  closeModal = output<void>();
  submitted = output<void>();

  handleSubmit(event: Event): void {
    event.preventDefault();
    this.submitted.emit();
  }
}
