import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService, Order } from '../../../services/order.service';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.scss']
})
export class OrderHistoryComponent implements OnInit {
  orders: Order[] = [];

  constructor(private orderSvc: OrderService) {}

  ngOnInit() {
    this.orders = this.orderSvc.getOrdersForCurrentUser();
  }

  /** Formatea los toppings como lista separada por comas */
  formatToppings(order: Order): string {
    return order.toppings && order.toppings.length
      ? order.toppings.map(t => t.name).join(', ')
      : 'Sin toppings';
  }
}
