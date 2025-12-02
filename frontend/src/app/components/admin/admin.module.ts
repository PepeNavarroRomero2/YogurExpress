// frontend/src/app/components/admin/admin.module.ts

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AdminRoutingModule } from './admin-routing.module';

import { DashboardComponent } from './dashboard/dashboard.component';
import { ManageInventoryComponent } from './manage-inventory/manage-inventory.component';
import { ManageProductsComponent } from './manage-products/manage-products.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AdminRoutingModule,
    DashboardComponent,
    ManageInventoryComponent,
    ManageProductsComponent
  ]
})
export class AdminModule {}

