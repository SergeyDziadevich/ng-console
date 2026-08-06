export enum CustomerLevel {
  STANDARD = 'standard',
  PREMIUM = 'premium',
  VIP = 'vip',
  ENTERPRISE = 'enterprise',
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  level: CustomerLevel;
  informations?: Record<string, unknown> | string;
  parentId?: string;
  parent?: Customer;
  subCustomers?: Customer[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCustomer {
  name: string;
  email?: string;
  phone?: string;
  level?: CustomerLevel;
  informations?: Record<string, unknown> | string;
  parentId?: string;
}

export interface UpdateCustomer {
  name?: string;
  email?: string;
  phone?: string;
  level?: CustomerLevel;
  informations?: Record<string, unknown> | string;
  parentId?: string;
}
