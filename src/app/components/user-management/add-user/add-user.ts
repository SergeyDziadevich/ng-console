import { Component, inject, signal } from '@angular/core';
import { form, FormField, required, email, minLength } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { UserService } from '../../../services/user-service';
import { Toast } from '../../toast/toast';
import { UserRole } from '../../../enums/user-role.enum';
import { CreateUser } from '../../../models/user.model';

@Component({
  selector: 'app-add-user',
  imports: [FormField, Toast],
  templateUrl: './add-user.html',
  styleUrl: './add-user.css',
})
export class AddUser {
  private router = inject(Router);
  private userService = inject(UserService);

  userRoles = Object.values(UserRole);

  userModel = signal<CreateUser>({
    name: '',
    email: '',
    password: '',
    role: UserRole.User,
  });

  showToast = signal(false);

  userForm = form(this.userModel, (schemaPath) => {
    required(schemaPath.name, { message: 'Name is required' });
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

