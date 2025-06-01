import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }   from '@angular/forms';
import { Router }        from '@angular/router';
import Swal              from 'sweetalert2';
import { CartService, Cart } from '../../../services/cart.service';
import { OrderService }      from '../../../services/order.service';
import { PointsService }     from '../../../services/points.service';

@Component({
  selector: 'app-payment-confirmation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment-confirmation.component.html',
  styleUrls: ['./payment-confirmation.component.scss']
})
export class PaymentConfirmationComponent implements OnInit {
  cart!: Cart;
  subtotal = 0;
  currentPoints = 0;

  // Puntos a canjear y cálculo de descuento
  pointsToRedeem = 0;
  discount = 0;

  // Total tras aplicar descuento
  total = 0;

  constructor(
    private cartSvc: CartService,
    private orderSvc: OrderService,
    private ptsSvc: PointsService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cart = this.cartSvc.getCart();
    // calculamos subtotales
    this.subtotal = this.cartSvc.getSubtotal();
    this.currentPoints = this.ptsSvc.getPoints();
    this.discount = 0;
    this.pointsToRedeem = 0;
    this.total = this.subtotal;

    // Si falta algún dato básico, volvemos al menú
    if (!this.cart.flavor || !this.cart.size || !this.cart.pickupTime) {
      this.router.navigate(['/user/menu']);
    }
  }

  /** Cuando cambia la cantidad de puntos a canjear, recalcula descuento y total */
  onRedeemChange() {
    if (this.pointsToRedeem > this.currentPoints) {
      this.pointsToRedeem = this.currentPoints;
    }
    // Definimos: 10 pts = 1€
    this.discount = this.pointsToRedeem / 10;
    this.total = Math.max(0, this.subtotal - this.discount);
  }

  /** Formatea la lista de toppings o devuelve 'Sin toppings' */
  formatToppings(): string {
    return this.cart.toppings.length
      ? this.cart.toppings.map(t => t.name).join(', ')
      : 'Sin toppings';
  }

  confirmPayment() {
    // 1) Canjear puntos (se resta saldo)
    if (this.pointsToRedeem > 0) {
      const ok = this.ptsSvc.redeemPoints(this.pointsToRedeem);
      if (!ok) {
        Swal.fire('Error', 'No tienes suficientes puntos.', 'error');
        return;
      }
    }

    // 2) Ajustar crédito en carrito para el pedido
    this.cartSvc.setCredit(this.discount);

    // 3) Crear pedido
    const order = this.orderSvc.placeOrder();
    if (!order) {
      Swal.fire('Error', 'No se pudo procesar tu pedido.', 'error');
      return;
    }

    // 4) Recompensar nuevos puntos: 1 pt por cada € gastado
    const earned = Math.floor(order.total);
    if (earned > 0) {
      this.ptsSvc.addPoints(earned);
    }

    // 5) Mostrar modal de éxito con detalle de canje y recompensa
    Swal.fire({
      icon: 'success',
      title: 'Pedido confirmado',
      html: `
        ${ this.discount > 0
            ? `Has canjeado ${this.pointsToRedeem} pts y descontado ${this.discount.toFixed(2)}€.<br/>`
            : ''
        }
        Has ganado ${earned} pts.
      `,
      confirmButtonText: 'Volver a inicio'
    }).then(() => this.router.navigate(['/user/menu']));
  }

  onBack() {
    this.router.navigate(['/user/pickup']);
  }
}
