import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../../services/customer.service';
import { CustomerLevel } from '../../../models/customer.model';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { UserModal } from '../../user-management/user-modal/user-modal';
import { Toast } from '@ng-console-platform/ui';
import { UpperCasePipe } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideBuilding2 } from '@ng-icons/lucide';

@Component({
  selector: 'app-add-customer',
  imports: [UserModal, Toast, TranslatePipe, FormsModule, UpperCasePipe, NgIconComponent],
  templateUrl: './add-customer.html',
  styleUrl: './add-customer.scss',
  viewProviders: [provideIcons({ lucideBuilding2 })],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddCustomer {
  private router = inject(Router);
  private customerService = inject(CustomerService);

  showToast = signal(false);
  isSubmitting = signal(false);
  error = signal<string | null>(null);

  name = signal('');
  email = signal('');
  phone = signal('');
  level = signal<CustomerLevel>(CustomerLevel.STANDARD);
  informations = signal('');
  parentId = signal<string | undefined>(undefined);

  customerLevels = Object.values(CustomerLevel);
  existingCustomers = computed(() => this.customerService.customersResource.value() || []);

  protected readonly isSubmitDisabled = computed(() => {
    return this.isSubmitting() || !this.name().trim();
  });

  close(): void {
    this.router.navigate(['/customers']);
  }

  onSubmit(): void {
    if (!this.name().trim()) {
      this.error.set('CUSTOMERS.NAME_REQUIRED');
      return;
    }

    this.error.set(null);
    this.isSubmitting.set(true);

    this.customerService
      .createCustomer({
        name: this.name().trim(),
        email: this.email().trim() || undefined,
        phone: this.phone().trim() || undefined,
        level: this.level(),
        informations: this.informations().trim() || undefined,
        parentId: this.parentId() && this.parentId() !== 'undefined' ? this.parentId() : undefined,
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.showToast.set(true);
          setTimeout(() => {
            this.showToast.set(false);
            this.close();
            this.customerService.customersResource.reload();
          }, 500);
        },
        error: () => {
          this.isSubmitting.set(false);
          this.error.set('CUSTOMERS.CREATE_FAILED');
        },
      });
  }
}
