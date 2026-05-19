import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-user',
  imports: [],
  templateUrl: './add-user.html',
  styleUrl: './add-user.css',
})
export class AddUser {
  private router = inject(Router);

  // Form fields
  name = signal('');
  email = signal('');
  password = signal('');
  role = signal('viewer');

  submitted = signal(false);

  // Validation
  nameError = computed(() => (this.name().trim() ? '' : 'Name is required'));
  emailError = computed(() => {
    const v = this.email().trim();
    if (!v) return 'Email is required';
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Invalid email address';
  });
  passwordError = computed(() => {
    const v = this.password();
    if (!v) return 'Password is required';
    return v.length < 8 ? 'Minimum 8 characters' : '';
  });

  isValid = computed(() => !this.nameError() && !this.emailError() && !this.passwordError());

  close() {
    this.router.navigate(['/user-management']);
  }

  submit() {
    this.submitted.set(true);
    if (!this.isValid()) return;

    console.log('New user:', {
      name: this.name(),
      email: this.email(),
      password: this.password(),
      role: this.role(),
    });

    this.close();
  }
}

