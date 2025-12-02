import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ManageInventoryComponent } from './manage-inventory/manage-inventory.component';
import { ManageProductsComponent } from './manage-products/manage-products.component';
import { ManagePromotionsComponent } from './manage-promotions/manage-promotions.component';

const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'inventario', component: ManageInventoryComponent },
  { path: 'productos', component: ManageProductsComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule {}

