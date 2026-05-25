import { Component, effect, inject, input, output, signal } from '@angular/core';
import { form, FormField, required, email } from '@angular/forms/signals';
import { UserService } from '../../../services/user-service';
import { Toast } from '../../toast/toast';
import { UserModal } from '../user-modal/user-modal';
import { UserRole } from '../../../enums/user-role.enum';
import { User } from '../../../models/user.model';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-edit-user',
  imports: [FormField, Toast, UserModal],
  templateUrl: './edit-user.html',
  styleUrl: './edit-user.scss',
})
export class EditUser {
  private userService = inject(UserService);

  user = input.required<User>();
  saved = output<void>();
  closed = output<void>();

  userRoles = Object.values(UserRole);
  showToast = signal(false);
  error = signal<string | null>(null);

  editModel = signal<{ name: string; email: string; role: UserRole }>({
    name: '',
    email: '',
    role: UserRole.User,
  });

  editForm = form(this.editModel, (schemaPath) => {
    required(schemaPath.name, { message: 'Name is required' });
    required(schemaPath.email, { message: 'Email is required' });
    email(schemaPath.email, { message: 'Enter a valid email address' });
  });

  constructor() {
    effect(() => {
      const u = this.user();
      this.editModel.set({ name: u.name, email: u.email, role: u.role });
    });
  }

  onSubmit(): void {
    this.error.set(null);
    this.userService.updateUser(this.user()._id, this.editModel()).subscribe({
      next: () => {
        this.showToast.set(true);
        setTimeout(() => {
          this.showToast.set(false);
          this.saved.emit();
        }, 500);
      },
      error: (err: unknown) => {
        this.error.set(this.getErrorMessage(err));
      },
    });
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error === 'string' && error.error.trim()) {
        return error.error;
      }
      if (error.error && typeof error.error === 'object' && 'msg' in error.error) {
        const message = (error.error as { msg?: unknown }).msg;
        if (typeof message === 'string' && message.trim()) {
          return message;
        }
      }
    }
    return 'Failed to update user. Please try again.';
  }
}

