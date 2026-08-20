import { Component, inject, signal, ChangeDetectionStrategy } from "@angular/core";
import { form, FormField, required, email, minLength } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { UserService } from "@ng-console/shared/data-access";
import { Toast } from "@ng-console/shared/ui";
import { UserModal } from "../user-modal/user-modal.component";
import { UserRole } from "@ng-console/shared/models";
import { CreateUser } from "@ng-console/shared/models";
import { HttpErrorResponse } from '@angular/common/http';

import { TranslatePipe } from "@ng-console/shared/util";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-add-user',
  imports: [FormField, Toast, UserModal, TranslatePipe],
  templateUrl: './add-user.html',
  styleUrl: './add-user.scss',
})
export class AddUser {
  private router = inject(Router);
  private userService = inject(UserService);

  userRoles = Object.values(UserRole);
  showToast = signal(false);
  error = signal<string | null>(null);
  avatarPreview = signal<string | null>(null);

  userModel = signal<CreateUser>({
    username: '',
    email: '',
    password: '',
    role: UserRole.User,
    avatarUrl: undefined,
  });

  onAvatarChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.avatarPreview.set(result);
      this.userModel.update((m) => ({ ...m, avatar: result }));
    };
    reader.readAsDataURL(file);
  }

  userForm = form(this.userModel, (schemaPath) => {
    required(schemaPath.username, { message: 'Name is required' });
    required(schemaPath.email, { message: 'Email is required' });
    email(schemaPath.email, { message: 'Enter a valid email address' });
    required(schemaPath.password, { message: 'Password is required' });
    minLength(schemaPath.password, 8, { message: 'Password must be at least 8 characters' });
  });

  close(): void {
    this.router.navigate(['/user-management']);
  }

  onSubmit(): void {
    this.error.set(null);
    this.userService.createUser(this.userModel()).subscribe({
      next: () => {
        this.showToast.set(true);
        setTimeout(() => {
          this.showToast.set(false);
          this.close();
          this.userService.usersResource.reload();
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
    return 'Failed to add user. Please try again.';
  }
}

export { AddUser as AddUserComponent };
