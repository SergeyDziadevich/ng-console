import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CustomerService } from "@ng-console/shared/data-access";
import { CustomerLevel } from "@ng-console/shared/models";
import { TranslatePipe } from "@ng-console/shared/util";
import { UserModal } from "../../user-management/user-modal/user-modal.component";
import { Toast } from "@ng-console/shared/ui";
import { UpperCasePipe } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideBuilding2 } from '@ng-icons/lucide';

@Component({
  selector: 'app-edit-customer',
  imports: [UserModal, Toast, TranslatePipe, FormsModule, UpperCasePipe, NgIconComponent],
  templateUrl: './edit-customer.html',
  styleUrl: './edit-customer.scss',
  viewProviders: [provideIcons({ lucideBuilding2 })],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditCustomer implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private customerService = inject(CustomerService);

  customerId = signal<string | null>(null);
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
  existingCustomers = computed(() => {
    const id = this.customerId();
    const all = this.customerService.customersResource.value() || [];
    return all.filter((c) => c.id !== id);
  });

  protected readonly isSubmitDisabled = computed(() => {
    return this.isSubmitting() || !this.name().trim();
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.close();
      return;
    }
    this.customerId.set(id);

    this.customerService.getCustomerById(id).subscribe({
      next: (customer) => {
        this.name.set(customer.name || '');
        this.email.set(customer.email || '');
        this.phone.set(customer.phone || '');
        this.level.set(customer.level || CustomerLevel.STANDARD);
        this.parentId.set(customer.parentId || customer.parent?.id || undefined);

        if (typeof customer.informations === 'string') {
          this.informations.set(customer.informations);
        } else if (customer.informations) {
          this.informations.set(JSON.stringify(customer.informations));
        }
      },
      error: () => {
        this.error.set('CUSTOMERS.NOT_FOUND');
      },
    });
  }

  close(): void {
    this.router.navigate(['/customers']);
  }

  onSubmit(): void {
    const id = this.customerId();
    if (!id) return;

    if (!this.name().trim()) {
      this.error.set('CUSTOMERS.NAME_REQUIRED');
      return;
    }

    this.error.set(null);
    this.isSubmitting.set(true);

    this.customerService
      .updateCustomer(id, {
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
          this.error.set('CUSTOMERS.UPDATE_FAILED');
        },
      });
  }
}

export { EditCustomer as EditCustomerComponent };
