import { Component, inject, signal } from '@angular/core';
import { form, FormField, required, email } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { UserService } from '../../../services/user-service';
import { Toast } from '../../toast/toast';

export interface CreateUser {
  name: string;
  email: string;
  password: string;
  role: string;
}

@Component({
  selector: 'app-add-user',
  imports: [FormField, Toast],
  templateUrl: './add-user.html',
  styleUrl: './add-user.css',
})
export class AddUser {
  private router = inject(Router);
  private userService = inject(UserService);

  userModel = signal<CreateUser>({
    name: '',
    email: '',
    password: '',
    role: 'editor',
  });

  showToast = signal(false);

  userForm = form(this.userModel, (schemaPath) => {
    required(schemaPath.email, { message: 'Email is required' });
    email(schemaPath.email, { message: 'Enter a valid email address' });
    required(schemaPath.password, { message: 'Password is required' });
  });

  close(): void {
    this.router.navigate(['/user-management']);
  }

  onSubmit(event: Event): void {
    event.preventDefault();

    this.userService.createUser(this.userModel()).subscribe(() => {
      this.showToast.set(true);
      setTimeout(() => {
        this.showToast.set(false);
        this.close();
        this.userService.usersResource.reload();
      }, 500);
    });
  }
}

