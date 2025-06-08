// frontend/src/app/components/admin/admin.module.ts

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AdminRoutingModule } from './admin-routing.module';

import { DashboardComponent } from './dashboard/dashboard.component';
import { ManageInventoryComponent } from './manage-inventory/manage-inventory.component';
import { ManageProductsComponent } from './manage-products/manage-products.component';
import { ManagePromotionsComponent } from './manage-promotions/manage-promotions.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AdminRoutingModule,
    // Al ser standalone, los importamos aquí:
    DashboardComponent,
    ManageInventoryComponent,
    ManageProductsComponent,
    ManagePromotionsComponent
  ]
})
export class AdminModule {}
