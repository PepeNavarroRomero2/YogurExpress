// src/app/services/admin-product.service.ts
// Servicio â€œstubâ€ en memoria: NO graba en base de datos, sÃ³lo en un array local.

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface AdminProduct {
  id_producto: number;
  nombre: string;
  tipo: string;
  precio: number;
  imagen_url?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminProductService {
  private data: AdminProduct[] = [
    { id_producto: 1, nombre: 'Strawberry Yogurt', tipo: 'sabor', precio: 3.50, imagen_url: '' },
    { id_producto: 2, nombre: 'Granola',          tipo: 'topping', precio: 1.00, imagen_url: '' },
    { id_producto: 3, nombre: 'Chocolate Chips',  tipo: 'topping', precio: 1.20, imagen_url: '' }
    // ... otros productos de ejemplo
  ];

  constructor() {}

  getAll(): Observable<AdminProduct[]> {
    return of(this.data.map(item => ({ ...item })));
  }

  create(formData: FormData): Observable<AdminProduct> {
    const newId = this.data.length > 0 ? Math.max(...this.data.map(i => i.id_producto)) + 1 : 1;
    const nombre = formData.get('nombre') as string;
    const tipo = formData.get('tipo') as string;
    const precio = parseFloat(formData.get('precio') as string);
    const imagen_url = ''; // Sin subida real
    const nuevo: AdminProduct = { id_producto: newId, nombre, tipo, precio, imagen_url };
    this.data.push(nuevo);
    return of(nuevo);
  }

  update(id: number, formData: FormData): Observable<AdminProduct> {
    const item = this.data.find(p => p.id_producto === id)!;
    if (item) {
      item.nombre = formData.get('nombre') as string;
      item.tipo = formData.get('tipo') as string;
      item.precio = parseFloat(formData.get('precio') as string);
      // No manejamos imagen en este ejemplo
    }
    return of(item);
  }

  delete(id: number): Observable<void> {
    this.data = this.data.filter(p => p.id_producto !== id);
    return of(void 0);
  }
}

