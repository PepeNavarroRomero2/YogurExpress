// src/app/components/admin/dashboard/dashboard.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

import { AuthService } from '../../../services/auth.service';
import { ManageProductsComponent } from '../manage-products/manage-products.component';
import { ManageInventoryComponent } from '../manage-inventory/manage-inventory.component';
import { ManagePromotionsComponent } from '../manage-promotions/manage-promotions.component';

import { OrderService, Order } from '../../../services/order.service';

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
  activeTab: 'stats' | 'products' | 'inventory' | 'promotions' | 'orders' = 'stats';
  orders: Order[] = [];
  pendingOrders: Order[] = [];

  constructor(
    private authService: AuthService,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  /** Carga todos los pedidos y filtra los pendientes */
  private loadOrders(): void {
    this.orderService.getAllOrders().subscribe({
      next: (data: Order[]) => {
        this.orders = data;
        this.pendingOrders = this.orders.filter(o => o.estado === 'pendiente');
      },
      error: err => {
        console.error('Error cargando pedidos', err);
        Swal.fire('Error', 'No se pudieron cargar los pedidos.', 'error');
      }
    });
  }

  setTab(tab: 'stats' | 'products' | 'inventory' | 'promotions' | 'orders'): void {
    this.activeTab = tab;
    if (tab === 'stats' || tab === 'orders') {
      this.loadOrders();
    }
  }

  onLogout(): void {
    this.authService.logout();
  }

  /** Marca un pedido pendiente como entregado */
  markDelivered(order: Order): void {
    this.orderService.updateOrderStatus(order.id_pedido, 'entregado').subscribe({
      next: () => {
        this.pendingOrders = this.pendingOrders.filter(o => o.id_pedido !== order.id_pedido);
        Swal.fire('¡Listo!', `Pedido ${order.codigo_pedido} completado.`, 'success');
      },
      error: err => {
        console.error('Error actualizando estado', err);
        Swal.fire('Error', 'No se pudo actualizar el estado del pedido.', 'error');
      }
    });
  }
}
