// src/app/components/user/payment-confirmation/payment-confirmation.component.ts

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { AuthService, User } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { CartService } from '../../../services/cart.service';
import {
  OrderService,
  OrderProduct,
  CreateOrderRequest
} from '../../../services/order.service';

@Component({
  selector: 'app-payment-confirmation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment-confirmation.component.html',
  styleUrls: ['./payment-confirmation.component.scss']
})
export class PaymentConfirmationComponent implements OnInit {
  flavor: any;
  toppings: any[] = [];
  size: any;
  pickupTime: string = '';

  subtotal = 0;
  descuento = 0;
  total = 0;

  puntosUsuario = 0;
  puntosAUsar = 0;

  errorMsg = '';

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private userService: UserService,
    private orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/user/login']);
      return;
    }

    this.flavor = this.cartService.getFlavor();
    this.toppings = this.cartService.getToppings();
    this.size = this.cartService.getSize();
    this.pickupTime = this.cartService.getPickupTime() || '';

    if (!this.flavor || !this.size || !this.pickupTime) {
      this.router.navigate(['/user/menu']);
      return;
    }

    // Calcular subtotal sin puntos aún
    this.subtotal = 0;
    if (this.flavor.precio) this.subtotal += Number(this.flavor.precio);
    if (this.size.precio)   this.subtotal += Number(this.size.precio);
    this.toppings.forEach(t => {
      if (t.precio) this.subtotal += Number(t.precio);
    });

    // Obtener puntos del usuario
    this.userService.getProfile().subscribe({
      next: (user: User) => {
        this.puntosUsuario = user.puntos;
        this.calculateTotal();
      },
      error: () => {
        this.errorMsg = 'No se pudieron cargar tus puntos.';
        this.calculateTotal();
      }
    });
  }

  get toppingNames(): string {
    if (!this.toppings || this.toppings.length === 0) {
      return '';
    }
    return this.toppings.map(t => t.nombre).join(', ');
  }

  calculateTotal() {
    // Ejemplo: 10 puntos = 1 €
    this.descuento = this.puntosAUsar / 10;
    this.total = Math.max(0, this.subtotal - this.descuento);
  }

  confirmPayment() {
    this.errorMsg = '';

    if (this.puntosAUsar > this.puntosUsuario) {
      Swal.fire('Error', 'No tienes suficientes puntos.', 'error');
      return;
    }

    const productosParaApi: OrderProduct[] = [];
    productosParaApi.push({ id_producto: this.flavor.id_producto, cantidad: 1 });
    this.toppings.forEach(t => {
      productosParaApi.push({ id_producto: t.id_producto, cantidad: 1 });
    });
    productosParaApi.push({ id_producto: this.size.id_producto, cantidad: 1 });

    const body: CreateOrderRequest = {
      productos: productosParaApi,
      hora_recogida: this.pickupTime,
      puntos_usados: this.puntosAUsar
    };

    this.orderService.createOrder(body).subscribe({
      next: res => {
        Swal.fire({
          title: '¡Pedido confirmado!',
          html: `
            Código de pedido: <strong>${res.codigo_pedido}</strong><br>
            Has ganado <strong>${res.puntos_ganados}</strong> puntos.<br>
            Total puntos restantes: <strong>${this.puntosUsuario - this.puntosAUsar + res.puntos_ganados}</strong>.
          `,
          icon: 'success',
          confirmButtonText: 'Aceptar'
        }).then(() => {
          this.cartService.clear();
          this.router.navigate(['/user/menu']);
        });
      },
      error: err => {
        const msg = err.error?.error || 'Error al crear el pedido.';
        Swal.fire('Error', msg, 'error');
      }
    });
  }
}
