// src/app/admin/dashboard/dashboard.component.ts
import { Component }      from '@angular/core';
import { CommonModule }   from '@angular/common';
import { ManageInventoryComponent } from '../manage-inventory/manage-inventory.component';
import { ManageProductsComponent }  from '../manage-products/manage-products.component';
import { ManagePromotionsComponent } from '../manage-promotions/manage-promotions.component';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ CommonModule, ManageInventoryComponent, ManageProductsComponent, ManagePromotionsComponent ],   // <— aquí le decimos que traiga NgIf, CurrencyPipe, etc.
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  todaysOrders = 42;
  todaysRevenue = 1234.56;
  topProduct = 'UltraWidget 3000';

  activeTab: 'products' | 'inventory' | 'promotions' = 'products';
  setTab(tab: 'products' | 'inventory' | 'promotions') {
    this.activeTab = tab;
  }
}
