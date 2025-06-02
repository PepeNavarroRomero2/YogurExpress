import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';    // <— Importa CommonModule
import { FormsModule } from '@angular/forms';      // <— Importa FormsModule si usas [(ngModel)]
import Swal from 'sweetalert2';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { CartService } from '../../../services/cart.service';
import {
  OrderService,
  OrderProduct,
  CreateOrderRequest
} from '../../../services/order.service';
import { User } from '../../../services/auth.service';

@Component({
  selector: 'app-payment-confirmation',
  standalone: true,          // ← Asegúrate de que sea standalone
  imports: [
    CommonModule,             // ← Necesario para *ngIf, pipe date, etc.
    FormsModule               // ← Solo si en tu plantilla usas [(ngModel)]; si no, bórralo
  ],
  templateUrl: './payment-confirmation.component.html',
  styleUrls: ['./payment-confirmation.component.scss']
})
export class PaymentConfirmationComponent implements OnInit {
  flavor: any;
  toppings: any[] = [];
  size: any;
  pickupTime: string = '';
  subtotal = 0;
  total = 0;
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

    // Calcular subtotal
    this.subtotal = 0;
    if (this.flavor.precio) this.subtotal += Number(this.flavor.precio);
    if (this.size.precio)   this.subtotal += Number(this.size.precio);
    this.toppings.forEach(t => {
      if (t.precio) this.subtotal += Number(t.precio);
    });
    this.total = this.subtotal;
  }

  confirmPayment() {
    this.errorMsg = '';

    const productosParaApi: OrderProduct[] = [];
    productosParaApi.push({ id_producto: this.flavor.id_producto, cantidad: 1 });
    this.toppings.forEach(t => {
      productosParaApi.push({ id_producto: t.id_producto, cantidad: 1 });
    });
    productosParaApi.push({ id_producto: this.size.id_producto, cantidad: 1 });

    const body: CreateOrderRequest = {
      productos: productosParaApi,
      hora_recogida: this.pickupTime
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

  // Getter para reemplazar el arrow function en la plantilla
  get toppingNames(): string {
    if (!this.toppings || this.toppings.length === 0) {
      return '';
    }
    return this.toppings.map(t => t.nombre).join(', ');
  }
}
