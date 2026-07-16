import { Component, inject, linkedSignal, signal } from '@angular/core';
import { form, FormField, required, email } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { httpResource } from '@angular/common/http';
import { UserService } from '../../../services/user-service';
import { Toast, SpinnerComponent } from '@ng-console-platform/ui';
import { UserModal } from '../user-modal/user-modal';
import { UserRole } from '../../../enums/user-role.enum';
import { User } from '../../../models/user.model';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-edit-user',
  imports: [FormField, Toast, UserModal, SpinnerComponent],
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

  editModel = linkedSignal<{ username: string; email: string; role: UserRole; avatarUrl?: string }>(
    () => {
      const u = this.userResource.value();
      if (!u) return { username: '', email: '', role: UserRole.User, avatarUrl: undefined };
      return {
        username: u.username,
        email: u.email,
        role: u.role || UserRole.User,
        avatarUrl: u.avatarUrl,
      };
    },
  );

  avatarPreview = linkedSignal<string | null>(() => this.userResource.value()?.avatarUrl ?? null);

  editForm = form(this.editModel, (schemaPath) => {
    required(schemaPath.username, { message: 'Name is required' });
    required(schemaPath.email, { message: 'Email is required' });
    email(schemaPath.email, { message: 'Enter a valid email address' });
  });

  onAvatarChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.avatarPreview.set(result);
      this.editModel.update((m) => ({ ...m, avatarUrl: result }));
    };
    reader.readAsDataURL(file);
  }

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
