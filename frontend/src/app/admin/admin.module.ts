import { NgModule }           from '@angular/core';
import { CommonModule }       from '@angular/common';
import { AdminRoutingModule } from './admin-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ManageInventoryComponent } from './manage-inventory/manage-inventory.component';

@NgModule({
  imports: [
    CommonModule,
    AdminRoutingModule,
    DashboardComponent,
    ManageInventoryComponent
  ]
})
export class AdminModule {}
