import { Component, inject, signal } from '@angular/core';
import { form, FormField, required, email, minLength } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { UserService } from '../../../services/user-service';
import { Toast } from '../../toast/toast';
import { UserRole } from '../../../enums/user-role.enum';
import { CreateUser } from '../../../models/user.model';
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

  userRoles = Object.values(UserRole);
  showToast = signal(false);
  createUserError = signal<string | null>(null);
  userModel = signal<CreateUser>({
    username: '',
    email: '',
    password: '',
    role: UserRole.User,
  });
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

  onSubmit(event: Event): void {
    event.preventDefault();
    this.createUserError.set(null);

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

    return 'Failed to add user. Please try again.';
  }
}

