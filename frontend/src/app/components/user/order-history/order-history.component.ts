// src/app/components/user/order-history/order-history.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { OrderService, OrderHistoryItem } from '../../../services/order.service';
import { AuthService, User } from '../../../services/auth.service';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.scss']
})
export class OrderHistoryComponent implements OnInit {
  orders: OrderHistoryItem[] = [];
  loading = true;
  errorMsg = '';

  constructor(
    private authService: AuthService,
    private orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user: User | null = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/user/login']);
      return;
    }

    this.orderService.getOrderHistory().subscribe({
      next: (res) => {
        this.orders = res.history;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al obtener historial:', err);
        if (err.status === 401 || err.status === 403) {
          this.errorMsg = 'Token inválido o no proporcionado. Inicia sesión de nuevo.';
        } else {
          this.errorMsg = 'No se pudo cargar tu historial. Intenta más tarde.';
        }
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/user/menu']);
  }
}
