// src/app/components/user/order-history/order-history.component.ts

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../../../services/auth.service';
import { OrderService, OrderHistoryItem } from '../../../services/order.service';

@Component({
  selector: 'app-order-history',
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.scss']
})
export class OrderHistoryComponent implements OnInit {
  orders: OrderHistoryItem[] = [];
  loading: boolean = true;
  errorMsg: string = '';

  constructor(
    private authService: AuthService,
    private orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 1) Validar que el usuario esté logueado
    const user: User | null = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/user/login']);
      return;
    }

    // 2) Llamar al backend para obtener el historial
    this.orderService.getOrderHistory().subscribe({
      next: (res) => {
        this.orders = res.history;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al obtener historial:', err);
        if (err.status === 401 || err.status === 403) {
          this.errorMsg = 'Token inválido o no proporcionado. Por favor, inicia sesión de nuevo.';
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
