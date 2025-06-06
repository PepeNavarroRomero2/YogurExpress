import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Ahora InventoryItem refleja lo que el backend devuelve:
 *   - id_producto: number
 *   - productName: string
 *   - cantidad_disponible: number
 */
export interface InventoryItem {
  id_producto: number;
  productName: string;
  cantidad_disponible: number;
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private API_URL = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  /**
   * GET /api/inventory
   * Devuelve array de InventoryItem con { id_producto, productName, cantidad_disponible }
   */
  getInventory(): Observable<InventoryItem[]> {
    return this.http.get<InventoryItem[]>(`${this.API_URL}/inventory`);
  }

  /**
   * PUT /api/inventory/:id_producto
   * Actualiza cantidad_disponible de un producto.
   */
  updateInventory(
    id_producto: number,
    cantidad_disponible: number
  ): Observable<void> {
    return this.http.put<void>(
      `${this.API_URL}/inventory/${id_producto}`,
      { cantidad_disponible }
    );
  }
}
