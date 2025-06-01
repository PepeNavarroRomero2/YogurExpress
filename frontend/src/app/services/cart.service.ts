import { Injectable } from '@angular/core';
import { Flavor, Topping, SizeOption } from './product.service';

export interface Cart {
  flavor?: Flavor;
  toppings: Topping[];
  size?: SizeOption;
  pickupTime?: Date;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private cart: Cart = { toppings: [] };
  private credit = 0;  // descuento (€) por puntos canjeados

  /** Guarda el sabor seleccionado */
  setFlavor(flavor: Flavor): void {
    this.cart.flavor = flavor;
  }

  getFlavor(): Flavor | undefined {
    return this.cart.flavor;
  }

  /** Toggle de toppings */
  toggleTopping(t: Topping): void {
    const idx = this.cart.toppings.findIndex(x => x.id === t.id);
    if (idx > -1) this.cart.toppings.splice(idx, 1);
    else this.cart.toppings.push(t);
  }

  getToppings(): Topping[] {
    return [...this.cart.toppings];
  }

  /** Selecciona el tamaño */
  setSize(s: SizeOption): void {
    this.cart.size = s;
  }

  getSize(): SizeOption | undefined {
    return this.cart.size;
  }

  /** Fecha y hora de recogida */
  setPickupTime(date: Date): void {
    this.cart.pickupTime = date;
  }

  getPickupTime(): Date | undefined {
    return this.cart.pickupTime;
  }

  /** Define un crédito (€) obtenido al canjear puntos */
  setCredit(amount: number): void {
    this.credit = amount;
  }

  /** Devuelve el crédito (€) pendiente de aplicar */
  getCredit(): number {
    return this.credit;
  }

  /** Precio total sin descuento */
  getSubtotal(): number {
    const base = this.cart.flavor?.price ?? 0;
    const extras = this.cart.toppings.reduce((sum, t) => sum + t.price, 0);
    const sizePrice = this.cart.size?.price ?? 0;
    return base + extras + sizePrice;
  }

  /** Precio total - crédito */
  getTotal(): number {
    return Math.max(0, this.getSubtotal() - this.credit);
  }

  /** Limpia carrito y crédito */
  clear(): void {
    this.cart = { toppings: [] };
    this.credit = 0;
  }

  getCart(): Cart {
    return { ...this.cart };
  }
}
