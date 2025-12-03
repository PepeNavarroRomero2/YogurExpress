import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swal, { SweetAlertIcon } from 'sweetalert2';

import { AuthService } from '../../../services/auth.service';
import { OrderService, Order, PedidoEstado } from '../../../services/order.service';

import { ManageProductsComponent } from '../manage-products/manage-products.component';
import { ManageInventoryComponent } from '../manage-inventory/manage-inventory.component';
import { ScheduleSettingsDialogComponent } from '../../shared/schedule-settings-dialog/schedule-settings-dialog.component';
import { LoyaltySettingsDialogComponent } from '../../shared/loyalty-settings-dialog/loyalty-settings-dialog.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ManageProductsComponent,
    ManageInventoryComponent,
    ScheduleSettingsDialogComponent,
    LoyaltySettingsDialogComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  activeTab: 'stats' | 'products' | 'inventory' = 'stats';
  orders: Order[] = [];
  pendingOrders: Order[] = [];

  // Métricas simples mostradas en el dashboard
  inventoryCount = 0;
  productCount = 0;

  showScheduleDialog = false;
  showLoyaltyDialog = false;

  constructor(
    private authService: AuthService,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    // Cargamos solo los pendientes (el endpoint ya filtra)
    this.loadPending();
  }

  onLogout(): void {
    this.authService.logout();
  }

  setTab(tab: 'stats' | 'products' | 'inventory'): void {
    this.activeTab = tab;
    if (tab === 'stats') this.loadPending();
  }

  private loadPending(): void {
    this.orderService.getPendingOrders().subscribe({
      next: (orders) => {
        // El endpoint devuelve pendientes; mantenemos ambas colecciones por compatibilidad
        this.orders = orders ?? [];
        this.pendingOrders = orders ?? [];
      },
      error: (err) => {
        console.error('Error obteniendo pedidos', err);
        this.toast('No se pudieron cargar los pedidos.', 'error');
      }
    });
  }

  private toast(text: string, icon: SweetAlertIcon = 'info'): void {
    Swal.fire({ text, icon, timer: 1400, showConfirmButton: false });
  }

  markReady(order: Order): void {
    this.orderService.updateStatus(order.id_pedido, 'listo').subscribe({
      next: () => {
        order.estado = 'listo' as PedidoEstado;
        this.pendingOrders = this.pendingOrders.filter(o => o.id_pedido !== order.id_pedido);
        this.toast(`Pedido ${this.codeLabel(order)} marcado como listo.`, 'success');
      },
      error: (err) => {
        console.error('Error actualizando estado', err);
        this.toast('No se pudo actualizar el estado del pedido.', 'error');
      }
    });
  }

  markDelivered(order: Order): void {
    this.orderService.updateStatus(order.id_pedido, 'completado').subscribe({
      next: () => {
        order.estado = 'completado' as PedidoEstado;
        this.pendingOrders = this.pendingOrders.filter(o => o.id_pedido !== order.id_pedido);
        this.toast(`Pedido ${this.codeLabel(order)} completado.`, 'success');
      },
      error: (err) => {
        console.error('Error actualizando estado', err);
        this.toast('No se pudo actualizar el estado del pedido.', 'error');
      }
    });
  }

  markRejected(order: Order): void {
    this.orderService.updateStatus(order.id_pedido, 'rechazado').subscribe({
      next: () => {
        order.estado = 'rechazado' as PedidoEstado;
        this.pendingOrders = this.pendingOrders.filter(o => o.id_pedido !== order.id_pedido);
        this.toast(`Pedido ${this.codeLabel(order)} rechazado.`, 'success');
      },
      error: (err) => {
        console.error('Error actualizando estado', err);
        this.toast('No se pudo actualizar el estado del pedido.', 'error');
      }
    });
  }

  codeLabel(order: Order): string | number {
    return order.codigo_pedido || order.codigo_unico || order.id_pedido;
  }
}

