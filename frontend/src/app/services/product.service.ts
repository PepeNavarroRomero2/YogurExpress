// src/app/services/product.service.ts

import { Injectable } from '@angular/core';

export interface Flavor {
  id: number;
  name: string;
  price: number;
  imageUrl?: string;
}

export interface Topping {
  id: number;
  name: string;
  price: number;
}

export interface SizeOption {
  id: number;
  name: string;
  price: number;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private flavors: Flavor[] = [
    { id: 1, name: 'Fresa',     price: 2.5, imageUrl: 'assets/images/fresa.png' },
    { id: 2, name: 'Vainilla',  price: 2.0, imageUrl: 'assets/images/vainilla.png' },
    { id: 3, name: 'Chocolate', price: 3.0, imageUrl: 'assets/images/chocolate.png' },
    // …añade más sabores según necesites
  ];

  private toppings: Topping[] = [
    { id: 1, name: 'Chispas de chocolate', price: 0.5 },
    { id: 2, name: 'Granola',              price: 0.7 },
    { id: 3, name: 'Frutos secos',         price: 1.0 },
    { id: 4, name: 'Miel',                 price: 0.3 },
    // …añade más toppings según necesites
  ];

  private sizes: SizeOption[] = [
    { id: 1, name: 'Pequeño', price: 0   },
    { id: 2, name: 'Mediano', price: 1   },
    { id: 3, name: 'Grande',  price: 2   },
  ];

  /**  
   * Devuelve una copia de la lista de sabores disponibles.  
   */  
  getFlavors(): Flavor[] {
    return [...this.flavors];
  }

  /**  
   * Devuelve una copia de la lista de toppings disponibles.  
   */  
  getToppings(): Topping[] {
    return [...this.toppings];
  }

  /**  
   * Devuelve una copia de las opciones de tamaño disponibles.  
   */  
  getSizes(): SizeOption[] {
    return [...this.sizes];
  }
}
