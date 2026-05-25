import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { form, FormField, required, email, minLength } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { UserService } from '../../../services/user-service';
import { Toast } from '../../toast/toast';
import { UserRole } from '../../../enums/user-role.enum';
import { CreateUser, User } from '../../../models/user.model';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-add-user',
  imports: [FormField, Toast],
  templateUrl: './add-user.html',
  styleUrl: './add-user.scss',
})
export class AddUser {
  private router = inject(Router);
  private userService = inject(UserService);

  /** Provide a user to switch the dialog into edit mode. */
  user = input<User | null>(null);

  /** Emitted when the dialog should be closed (edit mode only). */
  closed = output<void>();
  /** Emitted after a successful save (edit mode only). */
  saved = output<void>();

  isEditMode = computed(() => this.user() !== null);

  userRoles = Object.values(UserRole);
  showToast = signal(false);
  createUserError = signal<string | null>(null);

  // ── Add mode form ──────────────────────────────────────────────
  userModel = signal<CreateUser>({
    name: '',
    email: '',
    password: '',
    role: UserRole.User,
  });
  userForm = form(this.userModel, (schemaPath) => {
    required(schemaPath.name, { message: 'Name is required' });
    required(schemaPath.email, { message: 'Email is required' });
    email(schemaPath.email, { message: 'Enter a valid email address' });
    required(schemaPath.password, { message: 'Password is required' });
    minLength(schemaPath.password, 8, { message: 'Password must be at least 8 characters' });
  });

  // ── Edit mode form (no password) ───────────────────────────────
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
    // Populate edit form whenever the user input changes.
    effect(() => {
      const u = this.user();
      if (u) {
        this.editModel.set({ name: u.name, email: u.email, role: u.role });
      }
    });
  }

  close(): void {
    if (this.isEditMode()) {
      this.closed.emit();
    } else {
      this.router.navigate(['/user-management']);
    }
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.createUserError.set(null);

    if (this.isEditMode()) {
      this.userService.updateUser(this.user()!._id, this.editModel()).subscribe({
        next: () => {
          this.showToast.set(true);
          setTimeout(() => {
            this.showToast.set(false);
            this.saved.emit();
          }, 500);
        },
        error: (error: unknown) => {
          this.createUserError.set(this.getCreateUserErrorMessage(error));
        },
      });
    } else {
      this.userService.createUser(this.userModel()).subscribe({
        next: () => {
          this.showToast.set(true);
          setTimeout(() => {
            this.showToast.set(false);
            this.close();
            this.userService.usersResource.reload();
          }, 500);
        },
        error: (error: unknown) => {
          this.createUserError.set(this.getCreateUserErrorMessage(error));
        },
      });
    }
  }

  private getCreateUserErrorMessage(error: unknown): string {
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

    return this.isEditMode()
      ? 'Failed to update user. Please try again.'
      : 'Failed to add user. Please try again.';
  }
}
