// frontend/src/app/services/cart.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Flavor } from './product.service';

/**
 * Interfaz para el payload que envía el componente al crear un pedido.
 */
export interface CreateOrderPayload {
  productos: { id_producto: number; cantidad: number }[];
  hora_recogida: string;
}

/**
 * Interfaz para la respuesta esperada del backend al crear pedido.
 */
export interface CreateOrderResponse {
  codigo_pedido: string;
  puntos_ganados: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private flavorKey = 'cart_flavor';
  private sizeKey = 'cart_size';
  private toppingsKey = 'cart_toppings';
  private pickupTimeKey = 'cart_pickup_time';

  // URL base del backend (ajusta si tu servidor corre en otro host/puerto)
  private API_URL = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  /** ------------- MÉTODOS PARA MANEJAR LOCALSTORAGE ------------- */

  /** SABOR */
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

  /** TAMAÑO */
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

  /** TOPPINGS */
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

  /** HORA DE RECOGIDA */
  setPickupTime(hora: string): void {
    localStorage.setItem(this.pickupTimeKey, hora);
  }
  getPickupTime(): string | null {
    return localStorage.getItem(this.pickupTimeKey);
  }
  clearPickupTime(): void {
    localStorage.removeItem(this.pickupTimeKey);
  }

  /** Limpia todo el carrito/localStorage */
  clear(): void {
    this.clearFlavor();
    this.clearSize();
    this.clearToppings();
    this.clearPickupTime();
  }

  /** ------------- MÉTODO PARA CREAR PEDIDO EN BACKEND ------------- */

  /**
   * POST /api/orders
   * Envía el pedido al backend con el payload { productos, hora_recogida }.
   */
  createOrder(payload: CreateOrderPayload): Observable<CreateOrderResponse> {
    return this.http.post<CreateOrderResponse>(
      `${this.API_URL}/orders`,
      payload
    );
  }
}
