import { Injectable } from '@angular/core';
import { CartService, Cart } from './cart.service';
import { AuthService } from './auth.service';
import { Flavor, Topping, SizeOption } from './product.service';

export interface Order {
  id: string;
  userEmail: string;
  flavor: Flavor;
  toppings: Topping[];
  size: SizeOption;
  pickupTime: Date;
  total: number;
  date: Date;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private orders: Order[] = [];

  constructor(
    private cartSvc: CartService,
    private auth: AuthService
  ) {
    const saved = localStorage.getItem('orders');
    this.orders = saved ? JSON.parse(saved) : [];
  }

  /**
   * Genera un ID único basado en timestamp y aleatorio
   */
  private generateId(): string {
    return (
      Date.now().toString(36) +
      Math.random().toString(36).substring(2, 8)
    );
  }

  /**
   * Crea un nuevo pedido a partir del carrito y lo persiste en localStorage.
   * @returns El objeto Order generado o null si faltan datos.
   */
  placeOrder(): Order | null {
    const user = this.auth.getUser();
    const cart = this.cartSvc.getCart();
    if (!user || !cart.flavor || !cart.size || !cart.pickupTime) {
      return null;
    }

    const order: Order = {
      id: this.generateId(),
      userEmail: user.email,
      flavor: cart.flavor,
      toppings: cart.toppings,
      size: cart.size,
      pickupTime: cart.pickupTime,
      total: this.cartSvc.getTotal(),
      date: new Date()
    };

    this.orders.push(order);
    localStorage.setItem('orders', JSON.stringify(this.orders));
    this.cartSvc.clear();
    return order;
  }

  /**
   * Devuelve todos los pedidos del usuario actualmente logueado.
   */
  getOrdersForCurrentUser(): Order[] {
    const user = this.auth.getUser();
    if (!user) return [];
    return this.orders.filter(o => o.userEmail === user.email);
  }
}
