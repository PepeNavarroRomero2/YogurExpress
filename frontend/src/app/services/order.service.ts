// src/app/services/order.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface OrderHistoryItem {
  id_pedido: number;
  fecha_hora: string;
  hora_recogida: string;
  total: number;
  producto: string;
  codigo_pedido?: string;
}

export interface OrderProduct {
  id_producto: number;
  cantidad: number;
}

// Incluimos puntos_usados en la interfaz
export interface CreateOrderRequest {
  productos: OrderProduct[];
  hora_recogida: string;
  puntos_usados: number;
  codigo_promocional?: string;
}

export interface CreateOrderResponse {
  codigo_pedido: string;
  puntos_ganados: number;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = 'http://localhost:3000/api/orders';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getAuthHeaders(): HttpHeaders {
    return this.authService.getAuthHeaders();
  }

  /** Crea un nuevo pedido (POST /api/orders) */
  createOrder(body: CreateOrderRequest): Observable<CreateOrderResponse> {
    return this.http.post<CreateOrderResponse>(
      `${this.apiUrl}`,
      body,
      { headers: this.getAuthHeaders() }
    );
  }

  /** Obtiene el historial de pedidos (GET /api/orders/history) */
  getOrderHistory(): Observable<{ history: OrderHistoryItem[] }> {
    return this.http.get<{ history: OrderHistoryItem[] }>(
      `${this.apiUrl}/history`,
      { headers: this.getAuthHeaders() }
    );
  }
}
