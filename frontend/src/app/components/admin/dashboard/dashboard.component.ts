// src/app/components/admin/dashboard/dashboard.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service'; // Ajusta la ruta si es distinto

import { ManageProductsComponent } from '../manage-products/manage-products.component';
import { ManageInventoryComponent } from '../manage-inventory/manage-inventory.component';
import { ManagePromotionsComponent } from '../manage-promotions/manage-promotions.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ManageProductsComponent,
    ManageInventoryComponent,
    ManagePromotionsComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  todaysOrders: number = 0;
  todaysRevenue: number = 0;
  topProduct: string = '';
  activeTab: 'products' | 'inventory' | 'promotions' = 'products';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.todaysOrders = 12;
    this.todaysRevenue = 230;
    this.topProduct = 'Strawberry Yogurt';
  }

  setTab(tab: 'products' | 'inventory' | 'promotions'): void {
    this.activeTab = tab;
  }

  /** Invocado al pulsar “Cerrar sesión” */
  onLogout(): void {
    this.authService.logout();
  }
}
