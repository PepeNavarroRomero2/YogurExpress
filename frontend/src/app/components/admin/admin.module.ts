// src/app/components/admin/admin.module.ts

import { NgModule }           from '@angular/core';
import { CommonModule }       from '@angular/common';
import { AdminRoutingModule } from './admin-routing.module';

// Importamos los cuatro componentes standalone que usaremos en /admin/...
import { DashboardComponent }         from './dashboard/dashboard.component';
import { ManageInventoryComponent }   from './manage-inventory/manage-inventory.component';
import { ManageProductsComponent }    from './manage-products/manage-products.component';
import { ManagePromotionsComponent }  from './manage-promotions/manage-promotions.component';

@NgModule({
  imports: [
    CommonModule,
    AdminRoutingModule,

    // Aquí es donde “registramos” los componentes standalone
    DashboardComponent,
    ManageInventoryComponent,
    ManageProductsComponent,
    ManagePromotionsComponent
  ]
})
export class AdminModule {}
