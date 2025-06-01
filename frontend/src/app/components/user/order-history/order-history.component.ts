// frontend/src/app/components/user/order-history/order-history.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';    // para NgIf, NgFor
import { RouterModule, Router } from '@angular/router';
import { OrderService, Order } from '../../../services/order.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.scss']
})
export class OrderHistoryComponent implements OnInit {
  history: Order[] = [];
  errorMsg: string = '';

  // Cambiado a 'public' para poder usar 'router' desde el HTML
  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    public router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/user/login']);
      return;
    }
    this.orderService.getOrderHistory().subscribe({
      next: data => {
        this.history = data;
      },
      error: () => {
        this.errorMsg = 'No se pudo cargar el historial de pedidos.';
      }
    });
  }
}
