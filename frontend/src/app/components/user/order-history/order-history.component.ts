import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  constructor(private orders: OrderService) {}

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading = true;
    this.errorMsg = '';
    this.orders.getOrderHistory().subscribe({
      next: (arr) => {
        this.history = arr ?? [];
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
}
