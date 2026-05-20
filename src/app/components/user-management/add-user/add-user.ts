import { Component, computed, inject, signal } from '@angular/core';
import { form, FormField, required, email, debounce } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { User } from '../../../models/user.model';
import { UserService } from '../../../services/user-service';

@Component({
  selector: 'app-add-user',
  imports: [FormField],
  templateUrl: './add-user.html',
  styleUrl: './add-user.css',
})
export class AddUser {
  private router = inject(Router);
  private userService = inject(UserService);

  userModel = signal<User>({
    id: 0,
    name: '',
    email: '',
    password: '',
    role: 'editor',
  });

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

    console.log('User model:', this.userModel());

    this.userService.createUser(this.userModel()).subscribe((response) => console.log('User created:', response));

    // this.close();
  }
}

