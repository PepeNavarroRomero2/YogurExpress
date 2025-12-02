// src/app/services/producto.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Producto {
  id_producto: number;
  nombre: string;
  tipo: 'sabor' | 'topping' | 'tamano';
  precio: number;
  descripcion?: string;
  alergenos?: string;
  imagen_url?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  // Debe coincidir con el backend: http://localhost:3000/api/products
  private apiUrl = 'http://localhost:3000/api/products';

  constructor(private http: HttpClient) {}

  /** 1. Devuelve todos los productos (sin filtrar). */
  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}`);
  }

  /** 2. Devuelve todos los sabores (tipo = 'sabor'). */
  getSabores(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/sabores`);
  }

  /** 3. Devuelve todos los toppings (tipo = 'topping'). */
  getToppings(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/toppings`);
  }

  /** 4. Devuelve todos los tamaÃ±os (tipo = 'tamano'). */
  getTamanos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/tamanos`);
  }

  /**
   * 5. Crea un producto (sabor, topping o tamaÃ±o).
   *    EnvÃ­a JSON con:
   *    { nombre:String, tipo:'sabor'|'topping'|'tamano', precio:Number,
   *      descripcion?:String, alergenos?:String, imagen_url?:String }
   */
  createProducto(producto: Omit<Producto, 'id_producto'>): Observable<Producto> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<Producto>(`${this.apiUrl}`, producto, { headers });
  }

  /** 6. Actualiza un producto existente. */
  updateProducto(
    id: number,
    producto: Partial<Omit<Producto, 'id_producto'>>
  ): Observable<Producto> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<Producto>(`${this.apiUrl}/${id}`, producto, { headers });
  }

  /** 7. Elimina un producto. */
  deleteProducto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

