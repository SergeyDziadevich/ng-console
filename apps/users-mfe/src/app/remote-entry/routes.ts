import { Routes } from "@angular/router";
import { UserManagementComponent } from "../features/user-management/user-management.component";
import { AddUserComponent } from "../features/user-management/add-user/add-user.component";
import { EditUserComponent } from "../features/user-management/edit-user/edit-user.component";
import { CustomersComponent } from "../features/customers/customers.component";
import { AddCustomerComponent } from "../features/customers/add-customer/add-customer.component";
import { EditCustomerComponent } from "../features/customers/edit-customer/edit-customer.component";
import { canUserEditGuard } from "@ng-console/shared/util";

export const userManagementRoutes: Routes = [
  {
    path: "",
    component: UserManagementComponent,
    children: [
      { path: "add-user", component: AddUserComponent, canActivate: [canUserEditGuard] },
      { path: "edit-user/:id", component: EditUserComponent, canActivate: [canUserEditGuard] },
    ],
  },
];

export const customersRoutes: Routes = [
  {
    path: "",
    component: CustomersComponent,
    children: [
      { path: "add-customer", component: AddCustomerComponent },
      { path: "edit-customer/:id", component: EditCustomerComponent },
    ],
  },
];

export const ROUTES: Routes = [
  { path: "user-management", children: userManagementRoutes },
  { path: "customers", children: customersRoutes },
  { path: "", children: userManagementRoutes },
];