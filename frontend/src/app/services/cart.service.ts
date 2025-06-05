// frontend/src/app/services/cart.service.ts

import { Injectable } from '@angular/core';
import { Flavor } from './product.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private flavorKey = 'cart_flavor';
  private sizeKey = 'cart_size';
  private toppingsKey = 'cart_toppings';
  private pickupTimeKey = 'cart_pickup_time';

  constructor() { }

  /** ------------- SABOR ------------- */
  setFlavor(flavor: Flavor): void {
    localStorage.setItem(this.flavorKey, JSON.stringify(flavor));
  }
  getFlavor(): Flavor | null {
    const json = localStorage.getItem(this.flavorKey);
    return json ? JSON.parse(json) : null;
  }
  clearFlavor(): void {
    localStorage.removeItem(this.flavorKey);
  }

  /** ------------- TAMAÑO ------------- */
  setSize(size: Flavor): void {
    localStorage.setItem(this.sizeKey, JSON.stringify(size));
  }
  getSize(): Flavor | null {
    const json = localStorage.getItem(this.sizeKey);
    return json ? JSON.parse(json) : null;
  }
  clearSize(): void {
    localStorage.removeItem(this.sizeKey);
  }

  /** ------------- TOPPINGS ------------- */
  setToppings(toppings: Flavor[]): void {
    localStorage.setItem(this.toppingsKey, JSON.stringify(toppings));
  }
  getToppings(): Flavor[] {
    const json = localStorage.getItem(this.toppingsKey);
    return json ? JSON.parse(json) : [];
  }
  clearToppings(): void {
    localStorage.removeItem(this.toppingsKey);
  }

  /** ------------- HORA DE RECOGIDA ------------- */
  setPickupTime(hora: string): void {
    localStorage.setItem(this.pickupTimeKey, hora);
  }
  getPickupTime(): string | null {
    return localStorage.getItem(this.pickupTimeKey);
  }
  clearPickupTime(): void {
    localStorage.removeItem(this.pickupTimeKey);
  }

  /** ------------- MÉTODO PARA LIMPIAR TODO ------------- */
  clear(): void {
    this.clearFlavor();
    this.clearSize();
    this.clearToppings();
    this.clearPickupTime();
  }
}
