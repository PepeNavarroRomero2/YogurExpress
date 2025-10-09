import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

import { AuthService } from '../../../services/auth.service';
import { OrderService, Order, PedidoEstado } from '../../../services/order.service';

import { ManageProductsComponent } from '../manage-products/manage-products.component';
import { ManageInventoryComponent } from '../manage-inventory/manage-inventory.component';
import { ManagePromotionsComponent } from '../manage-promotions/manage-promotions.component';
import { ScheduleSettingsDialogComponent } from '../../shared/schedule-settings-dialog/schedule-settings-dialog.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ManageProductsComponent,
    ManageInventoryComponent,
    ManagePromotionsComponent,
    ScheduleSettingsDialogComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  activeTab: 'stats' | 'products' | 'inventory' | 'promotions' = 'stats';
  orders: Order[] = [];
  pendingOrders: Order[] = [];
  showScheduleDialog = false;

  constructor(
    private authService: AuthService,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  onLogout(): void {
    this.authService.logout();
  }

  setTab(tab: 'stats' | 'products' | 'inventory' | 'promotions'): void {
    this.activeTab = tab;
    if (tab === 'stats') this.loadOrders();
  }

  private loadOrders(): void {
    this.orderService.getAllOrders().subscribe({
      next: (orders) => {
        this.orders = orders ?? [];
        this.pendingOrders = this.orders.filter(o => (o.estado as PedidoEstado) === 'pendiente');
      },
      error: (err) => {
        console.error('Error obteniendo pedidos', err);
        Swal.fire('Error', 'No se pudieron cargar los pedidos.', 'error');
      }
    });
  }

  markReady(order: Order): void {
    this.orderService.updateOrderStatus(order.id_pedido, 'listo').subscribe({
      next: () => {
        order.estado = 'listo';
        Swal.fire('Actualizado', `Pedido ${order.codigo_unico ?? order.id_pedido} marcado como listo.`, 'success');
      },
      error: (err) => {
        console.error('Error actualizando estado', err);
        Swal.fire('Error', 'No se pudo actualizar el estado del pedido.', 'error');
      }
    });
  }

  markDelivered(order: Order): void {
    this.orderService.updateOrderStatus(order.id_pedido, 'completado').subscribe({
      next: () => {
        this.pendingOrders = this.pendingOrders.filter(o => o.id_pedido !== order.id_pedido);
        Swal.fire('¡Listo!', `Pedido ${order.codigo_unico ?? order.id_pedido} completado.`, 'success');
      },
      error: (err) => {
        console.error('Error actualizando estado', err);
        Swal.fire('Error', 'No se pudo actualizar el estado del pedido.', 'error');
      }
    });
  }
}
