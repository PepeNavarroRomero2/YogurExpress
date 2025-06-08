import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { AuthService, User } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { CartService } from '../../../services/cart.service';
import { Flavor } from '../../../services/product.service';
import { PromotionService } from '../../../services/promotion.service';
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
export class PaymentConfirmationComponent implements OnInit, AfterViewInit {
  flavor!: Flavor;
  toppings: Flavor[] = [];
  size!: Flavor;
  pickupTime: string = '';

  subtotal = 0;
  descuento = 0;
  total = 0;

  puntosUsuario = 0;
  puntosAUsar = 0;

  codigoPromocional: string = '';
  descuentoAplicado: number = 0;
  errorPromo: string = '';
  errorMsg = '';

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private promoService: PromotionService,
    private userService: UserService,
    private orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/user/login']);
      return;
    }

    this.flavor = this.cartService.getFlavor() as Flavor;
    this.toppings = this.cartService.getToppings() as Flavor[];
    this.size = this.cartService.getSize() as Flavor;
    this.pickupTime = this.cartService.getPickupTime() || '';

    if (!this.flavor || !this.size || !this.pickupTime) {
      this.router.navigate(['/user/menu']);
      return;
    }

    this.subtotal = 0;
    if (this.flavor.precio) this.subtotal += Number(this.flavor.precio);
    if (this.size.precio) this.subtotal += Number(this.size.precio);
    this.toppings.forEach(t => {
      if (t.precio) this.subtotal += Number(t.precio);
    });

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

  ngAfterViewInit(): void {
    setTimeout(() => {
      if ((window as any).paypal) {
        (window as any).paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'blue',
            shape: 'pill',
            label: 'pay'
          },
          createOrder: (data: any, actions: any) => {
            return actions.order.create({
              purchase_units: [
                {
                  amount: {
                    value: this.total.toFixed(2)
                  },
                  description: `Pedido Yogur: ${this.flavor.nombre} - ${this.size.nombre}`
                }
              ]
            });
          },
          onApprove: (data: any, actions: any) => {
            return actions.order.capture().then(() => {
              this.createOrderOnBackend();
            });
          },
          onCancel: () => {
            Swal.fire('Pago cancelado', 'Has cancelado el pago.', 'info');
          },
          onError: (err: any) => {
            console.error(err);
            Swal.fire('Error', 'Ocurrió un problema con PayPal.', 'error');
          }
        }).render('#paypal-button-container');
      }
    }, 0);
  }

  get toppingNames(): string {
    return this.toppings.map(t => t.nombre).join(', ');
  }

  calculateTotal(): void {
    const descuentoPuntos = this.puntosAUsar / 10;
    const descuentoPromo = this.subtotal * (this.descuentoAplicado / 100);
    this.descuento = descuentoPuntos + descuentoPromo;
    this.total = Math.max(0, this.subtotal - this.descuento);
  }

  simulatePurchase(): void {
    this.errorMsg = '';
    if (this.puntosAUsar > this.puntosUsuario) {
      Swal.fire('Error', 'No tienes suficientes puntos.', 'error');
      return;
    }
    this.createOrderOnBackend();
  }

  private createOrderOnBackend(): void {
    const productosParaApi: OrderProduct[] = [
      { id_producto: this.flavor.id_producto, cantidad: 1 },
      ...this.toppings.map(t => ({
        id_producto: t.id_producto,
        cantidad: 1
      })),
      { id_producto: this.size.id_producto, cantidad: 1 }
    ];

    const body: CreateOrderRequest = {
      productos: productosParaApi,
      hora_recogida: this.pickupTime,
      puntos_usados: this.puntosAUsar,
      codigo_promocional: this.codigoPromocional
    };

    this.orderService.createOrder(body).subscribe({
      next: res => {
        Swal.fire({
          title: '¡Pedido confirmado!',
          html: `
            Código de pedido: <strong>${res.codigo_pedido}</strong><br>
            Has ganado <strong>${res.puntos_ganados}</strong> puntos.<br>
            Puntos restantes: <strong>${
              this.puntosUsuario - this.puntosAUsar + res.puntos_ganados
            }</strong>.
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

  validarCodigoPromo(): void {
    this.errorPromo = '';
    if (!this.codigoPromocional) return;

    this.promoService.validateCode(this.codigoPromocional.trim().toLowerCase())
.subscribe({
      next: (promo) => {
        this.descuentoAplicado = promo.descuento;
        Swal.fire('¡Promoción aplicada!', `Se ha aplicado un ${promo.descuento}% de descuento`, 'success');
        this.calculateTotal();
      },
      error: () => {
        this.descuentoAplicado = 0;
        this.errorPromo = 'Código no válido';
        Swal.fire('Código inválido', 'No se encontró la promoción', 'error');
        this.calculateTotal();
      }
    });
  }
}
