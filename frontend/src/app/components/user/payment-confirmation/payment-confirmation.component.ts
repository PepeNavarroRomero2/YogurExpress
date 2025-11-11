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

// PayPal
import { PaypalService } from '../../../services/paypal.service';
import { loadPaypalSdk } from '../../../utils/load-paypal-sdk';

declare global {
  interface Window { paypal: any; }
}

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
  infoMsg = '';

  loyalty: LoyaltySettings = { earnRate: 1, pointsPerEuro: 10 };

  // PayPal
  currency = 'EUR';
  paypalOrderId: string | null = null;

  constructor(
    private router: Router,
    private auth: AuthService,
    private userService: UserService,
    private cartService: CartService,
    private orderService: OrderService,
    private loyaltyService: LoyaltyService,
    private paypalApi: PaypalService
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

  async ngAfterViewInit(): Promise<void> {
    try {
      const cfg = await this.paypalApi.getConfig();
      if (!cfg?.clientId) return; // si no hay PayPal configurado, no hacemos nada
      this.currency = cfg.currency || 'EUR';
      await loadPaypalSdk(cfg.clientId, this.currency);
      this.renderPaypalButtons();
    } catch (e: any) {
      // No bloquea la vista; mostramos error no intrusivo
      this.errorMsg = e?.message || 'No se pudo preparar PayPal.';
    }
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

  // ========= LÓGICA DE PEDIDO (COMÚN) =========

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
    const MM = (d.getMonth() + 1).toString(2).padStart(2, '0'); // BUG?
    // CORREGIDO:
    // const MM = (d.getMonth() + 1).toString().padStart(2, '0');
    const DD = d.getDate().toString().padStart(2, '0');
    const HH = d.getHours().toString().padStart(2, '0');
    const Min = d.getMinutes().toString().padStart(2, '0');

    // FIX aplicado:
    const MMfixed = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${yyyy}-${MMfixed}-${DD}T${HH}:${Min}:00`;
  }

  /** Cuerpo para crear pedido en tu backend */
  private buildCreateOrderRequest(): CreateOrderRequest {
    const pickupIso = this.toLocalIsoToday(this.pickupTimeHM);
    return {
      productos: this.buildOrderLines(),
      hora_recogida: pickupIso,
      puntos_usados: this.puntosAUsar
    };
  }

  // ========= BOTÓN "SIMULAR COMPRA" (TU FLUJO ORIGINAL) =========

  simulatePurchase(): void {
    this.createOrder();
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

    const body = this.buildCreateOrderRequest();

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
        const msg = err?.error?.error || 'Error al crear el pedido.';
        Swal.fire('Error', msg, 'error');
      }
    });
  }

  // ========= PAYPAL =========

  private renderPaypalButtons(): void {
    if (!window.paypal) return;

    window.paypal.Buttons({
      style: { layout: 'vertical' },

      // 1) Crear la orden de PayPal en el backend
      createOrder: async () => {
        // Validamos hora de recogida ANTES de abrir PayPal
        if (!this.pickupTimeHM) {
          this.errorMsg = 'Selecciona una hora de recogida';
          throw new Error('pickup time required');
        }

        try {
          const itemsForPaypal = this.buildOrderLines().map(l => ({
            productId: l.id_producto,
            qty: l.cantidad
          }));

          const payload: any = {
            items: itemsForPaypal,
            description: 'Pedido Yogurtería',
            puntos_usados: this.puntosAUsar,
            pointsPerEuro: this.loyalty.pointsPerEuro
          };

          const r = await this.paypalApi.createOrder(payload);
          if (!r?.id) throw new Error('Backend no devolvió order id');
          this.paypalOrderId = r.id;
          return r.id;
        } catch (e: any) {
          this.errorMsg = e?.message || 'No se pudo crear la orden de PayPal';
          throw e;
        }
      },

      // 2) Capturamos en el backend y, si va bien, creamos el pedido con /after-paypal
      onApprove: async (data: any) => {
        try {
          const cap = await this.paypalApi.captureOrder(data.orderID);
          if (cap?.status !== 'COMPLETED') {
            this.errorMsg = 'El pago no se completó';
            return;
          }

          const body: any = this.buildCreateOrderRequest();
          body.paypalOrderId = this.paypalOrderId || data.orderID;

          this.orderService.createOrderAfterPaypal(body).subscribe({
            next: (res: CreateOrderResponse) => {
              Swal.fire({
                title: '¡Pago completado y pedido confirmado!',
                html: `
                  Código: <strong>${res.codigo_pedido}</strong><br>
                  Total: <strong>€${res.total.toFixed(2)}</strong><br>
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
              const msg = err?.error?.error || 'El pago fue correcto, pero falló la creación del pedido.';
              Swal.fire('Atención', msg, 'warning');
            }
          });
        } catch (e: any) {
          this.errorMsg = e?.message || 'Error al capturar el pago';
        }
      },

      onCancel: () => {
        this.infoMsg = 'Pago cancelado por el usuario.';
      },

      onError: (err: any) => {
        console.error(err);
        this.errorMsg = 'Ocurrió un error con PayPal.';
      }
    }).render('#paypal-button-container');
  }
}
