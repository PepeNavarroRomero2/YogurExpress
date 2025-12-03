import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OrderService, OrderHistoryItem } from '../../../services/order.service';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.scss']
})
export class OrderHistoryComponent implements OnInit {
  history: OrderHistoryItem[] = [];
  loading = false;
  errorMsg = '';

  constructor(private orders: OrderService, private router: Router) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  goBackToMenu(): void {
    this.router.navigate(['/user/menu']);
  }

  loadHistory(): void {
    this.loading = true;
    this.errorMsg = '';
    this.orders.getOrderHistory().subscribe({
      next: (res) => {
        console.log('order history', res);
        const data = Array.isArray(res) ? res : (res as any)?.data || [];
        this.history = (data || []).map((item: OrderHistoryItem) => ({
          ...item,
          estado: this.normalizedState(item)
        }));
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'No se pudo cargar el historial de pedidos.';
        this.loading = false;
      }
    });
  }

  codeOf(o: OrderHistoryItem): string | number {
    return o.codigo_unico || o.codigo_pedido || (o.id_pedido ?? '');
  }

  stateLabel(o: OrderHistoryItem): string {
    const state = this.normalizedState(o);
    if (!state) return '—';
    return state.charAt(0).toUpperCase() + state.slice(1);
  }

  stateClass(o: OrderHistoryItem): string {
    const state = this.normalizedState(o);
    if (state === 'pendiente') return 'tag-warning';
    if (state === 'listo') return 'tag-info';
    if (state === 'completado') return 'tag-success';
    return '';
  }

  shouldShowCode(o: OrderHistoryItem): boolean {
    return this.normalizedState(o) !== 'completado';
  }

  private normalizedState(o: OrderHistoryItem): string {
    return (o.estado || '').toString().trim().toLowerCase();
  }
}
