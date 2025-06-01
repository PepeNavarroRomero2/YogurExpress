import { Injectable } from '@angular/core';
import { Flavor } from './product.service';

export interface Cart {
  flavor?: Flavor;
  toppings: Flavor[];
  size?: Flavor;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cart: Cart = { toppings: [] };

  /** Guardar el sabor seleccionado */
  setFlavor(flavor: Flavor) {
    this.cart.flavor = flavor;
  }
  getFlavor(): Flavor | undefined {
    return this.cart.flavor;
  }

  /** Guardar toppings seleccionados */
  setToppings(toppings: Flavor[]) {
    this.cart.toppings = toppings;
  }
  getToppings(): Flavor[] {
    return this.cart.toppings;
  }

  /** Guardar tamaño seleccionado */
  setSize(size: Flavor) {
    this.cart.size = size;
  }
  getSize(): Flavor | undefined {
    return this.cart.size;
  }

  /** Limpiar todo el carrito (y la hora de recogida de localStorage) */
  clear() {
    this.cart = { toppings: [] };
    localStorage.removeItem('pickup_time');
  }
}
