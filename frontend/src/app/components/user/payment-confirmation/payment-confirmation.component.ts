// frontend/src/app/components/user/payment-confirmation/payment-confirmation.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { CartService } from '../../../services/cart.service';
import { OrderService, CreateOrderRequest, OrderProduct } from '../../../services/order.service';
import { UserService } from '../../../services/user.service';
import { User, AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-payment-confirmation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './payment-confirmation.component.html',
  styleUrls: ['./payment-confirmation.component.scss']
})
export class PaymentConfirmationComponent implements OnInit {
  flavor: any;
  toppings: any[] = [];
  size: any;
  pickupTime: string = '';
  puntosUsuario: number = 0;
  puntosAUsar: number = 0;
  subtotal: number = 0;
  descuento: number = 0;
  total: number = 0;
  errorMsg: string = '';

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
    this.pickupTime = localStorage.getItem('pickup_time') || '';

    if (!this.flavor || !this.size || !this.pickupTime) {
      this.router.navigate(['/user/menu']);
      return;
    }

    this.subtotal = this.flavor.precio + this.size.precio;
    for (let t of this.toppings) {
      this.subtotal += t.precio;
    }

    this.userService.getProfile().subscribe({
      next: (user: User) => {
        this.puntosUsuario = user.puntos;
        this.calculateTotal();
      },
      error: () => {
        this.errorMsg = 'No se pudieron cargar tus puntos.';
      }
    });
  }

  /** Nombres de todos los toppings separados por coma */
  get toppingNames(): string {
    return this.toppings.map(t => t.nombre).join(', ');
  }

  /** Precio total de toppings */
  get toppingsPrice(): number {
    return this.toppings.reduce((sum, t) => sum + t.precio, 0);
  }

  calculateTotal() {
    this.descuento = this.puntosAUsar / 10;
    this.total = Math.max(0, this.subtotal - this.descuento);
  }

  onPointsChange(event: Event) {
    const val = +(event.target as HTMLInputElement).value;
    this.puntosAUsar = val;
    this.calculateTotal();
  }

  confirmPayment() {
    this.errorMsg = '';

    if (this.puntosAUsar > this.puntosUsuario) {
      Swal.fire('Error', 'No tienes suficientes puntos para canjear.', 'error');
      return;
    }

    const productosParaApi: OrderProduct[] = [];
    productosParaApi.push({ id_producto: this.flavor.id_producto, cantidad: 1 });
    for (let t of this.toppings) {
      productosParaApi.push({ id_producto: t.id_producto, cantidad: 1 });
    }
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
          text: `Código de seguimiento: ${res.codigo_pedido}`,
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
