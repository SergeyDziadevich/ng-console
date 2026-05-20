import { Component, input } from '@angular/core';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.html',
  styleUrl: './toast.css',
})
export class Toast {
  message = input('');
  type = input('success');
}
