import { Component, inject, linkedSignal, signal } from '@angular/core';
import { form, FormField, required, email } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { httpResource } from '@angular/common/http';
import { UserService } from '../../../services/user-service';
import { Toast } from '../../toast/toast';
import { UserModal } from '../user-modal/user-modal';
import { UserRole } from '../../../enums/user-role.enum';
import { User } from '../../../models/user.model';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-edit-user',
  imports: [FormField, Toast, UserModal],
  templateUrl: './edit-user.html',
  styleUrl: './edit-user.scss',
})
export class EditUser {
  private userService = inject(UserService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private userId = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') ?? '')));

  userResource = httpResource<User>(() => {
    const id = this.userId();
    if (!id) return undefined;
    return `${environment.apiUrl}/api/users/${id}`;
  });

  userRoles = Object.values(UserRole);
  showToast = signal(false);
  error = signal<string | null>(null);

  editModel = linkedSignal<{ name: string; email: string; role: UserRole }>(() => {
    const u = this.userResource.value();
    if (!u) return { name: '', email: '', role: UserRole.User };
    return { name: u.name, email: u.email, role: u.role || UserRole.User };
  });

  editForm = form(this.editModel, (schemaPath) => {
    required(schemaPath.name, { message: 'Name is required' });
    required(schemaPath.email, { message: 'Email is required' });
    email(schemaPath.email, { message: 'Enter a valid email address' });
  });


  close(): void {
    this.router.navigate(['/user-management']);
  }

  onSubmit(): void {
    const id = this.userId();
    if (!id) return;
    this.error.set(null);
    const model = this.editModel();
    if (!model.role) model.role = UserRole.User;
    this.userService.updateUser(id, model).subscribe({
      next: () => {
        this.showToast.set(true);
        setTimeout(() => {
          this.showToast.set(false);
          this.userService.usersResource.reload();
          this.close();
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
