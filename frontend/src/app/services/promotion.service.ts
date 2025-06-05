// frontend/src/app/services/promotion.service.ts

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface Promotion {
  id_promocion: number;
  codigo: string;
  descuento: number; // Porcentaje, p.ej. 20 equivale a –20%
}

@Injectable({
  providedIn: 'root'
})
export class PromotionService {
  // Datos de ejemplo para que el componente muestre algo
  private data: Promotion[] = [
    { id_promocion: 1, codigo: 'Strawberry Yogurt', descuento: 20 },
    { id_promocion: 2, codigo: 'FROZEN10',          descuento: 10 },
    { id_promocion: 3, codigo: 'SAVE25',            descuento: 25 },
  ];

  constructor() {}

  /** Devuelve todas las promociones */
  getPromotions(): Observable<Promotion[]> {
    // Retornamos un clon del array original
    return of(this.data.map(p => ({ ...p })));
  }

  /** Crea una nueva promoción en el array local */
  createPromotion(p: { codigo: string; descuento: number }): Observable<void> {
    const newId =
      this.data.length > 0
        ? Math.max(...this.data.map(i => i.id_promocion)) + 1
        : 1;
    this.data.push({ id_promocion: newId, codigo: p.codigo, descuento: p.descuento });
    return of(void 0);
  }

  /** Actualiza una promoción existente */
  updatePromotion(id: number, p: { codigo: string; descuento: number }): Observable<void> {
    const item = this.data.find(i => i.id_promocion === id);
    if (item) {
      item.codigo = p.codigo;
      item.descuento = p.descuento;
    }
    return of(void 0);
  }

  /** Elimina una promoción por su ID */
  deletePromotion(id: number): Observable<void> {
    this.data = this.data.filter(i => i.id_promocion !== id);
    return of(void 0);
  }
}
