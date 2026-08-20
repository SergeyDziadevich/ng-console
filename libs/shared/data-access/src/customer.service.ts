import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { environment } from "@env/environment";
import { Observable } from 'rxjs';
import { CreateCustomer, Customer, UpdateCustomer } from "@ng-console/shared/models";

export interface CustomerFilter {
  search?: string;
  level?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private httpClient = inject(HttpClient);

  readonly filterParams = signal<CustomerFilter>({});

  customersResource = httpResource<Customer[]>(() => {
    return `${environment.apiUrl}/api/customers`;
  });

  getCustomers(): Observable<Customer[]> {
    return this.httpClient.get<Customer[]>(`${environment.apiUrl}/api/customers`);
  }

  getCustomerById(id: string): Observable<Customer> {
    return this.httpClient.get<Customer>(`${environment.apiUrl}/api/customers/${id}`);
  }

  createCustomer(customer: CreateCustomer): Observable<Customer> {
    return this.httpClient.post<Customer>(`${environment.apiUrl}/api/customers`, customer);
  }

  updateCustomer(id: string, customer: UpdateCustomer): Observable<Customer> {
    return this.httpClient.patch<Customer>(`${environment.apiUrl}/api/customers/${id}`, customer);
  }

  deleteCustomer(id: string): Observable<void> {
    return this.httpClient.delete<void>(`${environment.apiUrl}/api/customers/${id}`);
  }
}
