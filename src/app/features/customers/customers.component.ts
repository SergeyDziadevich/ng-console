import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CustomerService } from "@ng-console/shared/data-access";
import { Customer, CustomerLevel } from "@ng-console/shared/models";
import { TranslatePipe } from "@ng-console/shared/util";
import { UpperCasePipe } from '@angular/common';

@Component({
  selector: 'app-customers',
  imports: [RouterOutlet, TranslatePipe, UpperCasePipe],
  templateUrl: './customers.html',
  styleUrl: './customers.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Customers {
  private customerService = inject(CustomerService);
  private router = inject(Router);

  protected readonly searchFilter = signal('');
  protected readonly levelFilter = signal('');

  protected readonly customersResource = this.customerService.customersResource;
  protected readonly isLoading = this.customersResource.isLoading;

  protected readonly filteredCustomers = computed(() => {
    const list = this.customersResource.value() || [];
    const search = this.searchFilter().toLowerCase().trim();
    const level = this.levelFilter();

    return list.filter((c) => {
      const matchesSearch =
        !search ||
        c.name.toLowerCase().includes(search) ||
        (c.email && c.email.toLowerCase().includes(search)) ||
        (c.phone && c.phone.toLowerCase().includes(search));

      const matchesLevel = !level || c.level === level;

      return matchesSearch && matchesLevel;
    });
  });

  protected readonly customerLevels = Object.values(CustomerLevel);

  onSearchChange(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchFilter.set(val);
  }

  onLevelFilterChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.levelFilter.set(val);
  }

  clearFilters() {
    this.searchFilter.set('');
    this.levelFilter.set('');
  }

  navigateToAddCustomer() {
    this.router.navigate(['/customers', 'add-customer']);
  }

  navigateToEditCustomer(customer: Customer) {
    this.router.navigate(['/customers', 'edit-customer', customer.id]);
  }

  deleteCustomer(customer: Customer) {
    if (confirm(`Are you sure you want to delete customer "${customer.name}"?`)) {
      this.customerService.deleteCustomer(customer.id).subscribe({
        next: () => {
          this.customersResource.reload();
        },
        error: (err: unknown) => {
          console.error('Error deleting customer:', err);
        },
      });
    }
  }

  getInformationsText(info: Record<string, unknown> | string | undefined): string {
    if (!info) return '-';
    if (typeof info === 'string') return info;
    try {
      return JSON.stringify(info);
    } catch {
      return String(info);
    }
  }
}
