import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { AuthService, User } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { CartService } from '../../../services/cart.service';
import { Flavor } from '../../../services/product.service';
import {
  OrderService,
  OrderProduct,
  CreateOrderRequest,
  CreateOrderResponse
} from '../../../services/order.service';
import { LoyaltyService, LoyaltySettings } from '../../../services/loyalty.service';

@Component({
  selector: 'app-payment-confirmation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment-confirmation.component.html',
  styleUrls: ['./payment-confirmation.component.scss']
})
export class PaymentConfirmationComponent implements OnInit, AfterViewInit {
  flavor!: Flavor;
  toppings: Flavor[] = [];
  size!: Flavor;

  /** Hora del carrito en formato HH:mm (viene de SelectTime) */
  pickupTimeHM: string = '';

  subtotal = 0;
  descuento = 0;
  total = 0;

  puntosUsuario = 0;
  puntosAUsar = 0;

  errorMsg = '';

  loyalty: LoyaltySettings = { earnRate: 1, pointsPerEuro: 10 };

  constructor(
    private router: Router,
    private auth: AuthService,
    private userService: UserService,
    private cartService: CartService,
    private orderService: OrderService,
    private loyaltyService: LoyaltyService
  ) {}

  ngOnInit(): void {
    // Datos del carrito
    this.flavor = this.cartService.getFlavor() as any;
    this.toppings = this.cartService.getToppings() || [];
    this.size = this.cartService.getSize() as any;
    this.pickupTimeHM = this.cartService.getPickupTime() || ''; // "HH:mm"

    // Subtotal
    this.calculateSubtotal();

    // Puntos actuales del usuario
    const user = this.auth.getCurrentUser?.() as User | undefined;
    if (user) this.puntosUsuario = user.puntos || 0;

    // Reglas de puntos
    this.loyaltyService.load().subscribe({
      next: () => {
        this.loyalty = this.loyaltyService.value;
        this.calculateTotal();
      },
      error: () => {
        this.loyalty = this.loyaltyService.value;
        this.calculateTotal();
      }
    });
  }

  ngAfterViewInit(): void {
    // PayPal se integrará aquí si aplica
  }

  get toppingNames(): string {
    return (this.toppings || []).map(t => t.nombre).join(', ');
  }

  /** Etiqueta visible en UI (ya viene en HH:mm) */
  get pickupTimeLabel(): string {
    return this.pickupTimeHM || '';
  }

  private calculateSubtotal(): void {
    const f = this.flavor?.precio || 0;
    const s = this.size?.precio || 0;
    const t = (this.toppings || []).reduce((acc, it) => acc + (it.precio || 0), 0);
    this.subtotal = Math.round((f + s + t) * 100) / 100;
  }

  /** Máximo canjeable según saldo y subtotal con la regla actual */
  get maxRedeemable(): number {
    const pointsPerEuro = this.loyalty.pointsPerEuro || 10;
    const maxBySaldo = this.puntosUsuario;
    const maxBySubtotal = Math.floor(this.subtotal * pointsPerEuro);
    return Math.min(maxBySaldo, maxBySubtotal);
  }

  calculateTotal(): void {
    const pointsPerEuro = this.loyalty.pointsPerEuro || 10;
    const desired = Math.max(0, Math.floor(this.puntosAUsar || 0));
    this.puntosAUsar = Math.min(desired, this.maxRedeemable);

    this.descuento = this.puntosAUsar / pointsPerEuro;
    this.total = Math.max(0, Math.round((this.subtotal - this.descuento) * 100) / 100);
  }

  simulatePurchase(): void {
    this.createOrder();
  }

  private buildOrderLines(): OrderProduct[] {
    const lines: OrderProduct[] = [];
    if (this.flavor) lines.push({ id_producto: this.flavor.id_producto, cantidad: 1 });
    if (this.size)   lines.push({ id_producto: this.size.id_producto, cantidad: 1 });
    for (const t of (this.toppings || [])) {
      lines.push({ id_producto: t.id_producto, cantidad: 1 });
    }
    return lines;
  }

  /** Convierte "HH:mm" de hoy a "YYYY-MM-DDTHH:mm:00" (LOCAL, sin 'Z') */
  private toLocalIsoToday(hm: string): string {
    const [hh, mm] = (hm || '').split(':').map(n => parseInt(n, 10));
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return '';
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0, 0);

    const yyyy = d.getFullYear();
    const MM = (d.getMonth() + 1).toString().padStart(2, '0');
    const DD = d.getDate().toString().padStart(2, '0');
    const HH = d.getHours().toString().padStart(2, '0');
    const Min = d.getMinutes().toString().padStart(2, '0');

    return `${yyyy}-${MM}-${DD}T${HH}:${Min}:00`;
  }

  private createOrder(): void {
    if (!this.pickupTimeHM) {
      this.errorMsg = 'Selecciona una hora de recogida';
      return;
    }

    const pickupIso = this.toLocalIsoToday(this.pickupTimeHM);
    if (!pickupIso) {
      Swal.fire('Error', 'Formato de hora de recogida inválido.', 'error');
      return;
    }

    const body: CreateOrderRequest = {
      productos: this.buildOrderLines(),
      hora_recogida: pickupIso,        // ✅ ISO local para el backend
      puntos_usados: this.puntosAUsar
    };

    this.orderService.createOrder(body).subscribe({
      next: (res: CreateOrderResponse) => {
        Swal.fire({
          title: '¡Pedido confirmado!',
          html: `
            Código: <strong>${res.codigo_pedido}</strong><br>
            Total pagado: <strong>€${res.total.toFixed(2)}</strong><br>
            Has ganado <strong>${res.puntos_ganados}</strong> puntos.<br>
            Puntos restantes: <strong>${res.puntos_totales}</strong>.
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
