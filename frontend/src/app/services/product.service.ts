import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Flavor {
  id_producto: number;
  nombre: string;
  tipo: string;
  precio: number;
  descripcion?: string;
  alergenos?: string;
  imagen_url?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private API_URL = 'http://localhost:3000/api/products';

  constructor(private http: HttpClient) { }

  /** GET /api/products/sabores */
  getFlavors(): Observable<Flavor[]> {
    return this.http.get<Flavor[]>(`${this.API_URL}/sabores`);
  }

  /** GET /api/products/toppings */
  getToppings(): Observable<Flavor[]> {
    return this.http.get<Flavor[]>(`${this.API_URL}/toppings`);
  }

  /** GET /api/products/tamanos */
  getSizes(): Observable<Flavor[]> {
    return this.http.get<Flavor[]>(`${this.API_URL}/tamanos`);
  }
}
