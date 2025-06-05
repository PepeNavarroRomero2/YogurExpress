// frontend/src/app/services/inventory.service.ts

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

// Definimos la misma interfaz que usa el componente de Inventario
export interface InventoryItem {
  id: number;
  productName: string;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  // Datos de ejemplo para que el componente muestre algo
  private data: InventoryItem[] = [
    { id: 1, productName: 'Strawberry Yogurt', quantity: 40 },
    { id: 2, productName: 'Granola',        quantity: 15 },
    { id: 3, productName: 'Chocolate Chips', quantity: 35 },
  ];

  constructor() {}

  /** Devuelve el inventario completo (para filtrar en el frontend) */
  getInventory(): Observable<InventoryItem[]> {
    // Hacemos un clon para que el componente no modifique este array directo
    return of(this.data.map(item => ({ ...item })));
  }

  /**
   * Actualiza la cantidad de un ítem del inventario.
   * Como no hay backend, simplemente modificamos el array local y devolvemos un Observable vacío.
   */
  updateInventory(id: number, quantity: number): Observable<void> {
    const item = this.data.find(i => i.id === id);
    if (item) {
      item.quantity = quantity;
    }
    return of(void 0);
  }
}
