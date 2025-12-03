// src/app/services/inventory.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface InventoryItem {
  id_producto: number;
  productName: string;
  cantidad_disponible: number;
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private apiUrl = '/api/inventory';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /** GET no necesita headers especiales, solo devuelve la lista */
  getInventory(): Observable<InventoryItem[]> {
    return this.http.get<InventoryItem[]>(this.apiUrl);
  }

  /** PUT sÃ­ envÃ­a token para actualizar stock */
  updateInventory(id: number, cantidad: number): Observable<InventoryItem> {
    const headers = this.authService.getAuthHeaders()
      .set('Content-Type', 'application/json');
    return this.http.put<InventoryItem>(
      `${this.apiUrl}/${id}`,
      { cantidad_disponible: cantidad },
      { headers }
    );
  }
}

