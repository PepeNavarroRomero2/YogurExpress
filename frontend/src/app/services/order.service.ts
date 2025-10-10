import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export type PedidoEstado = 'pendiente' | 'listo' | 'completado' | 'rechazado';

export interface Order {
  id_pedido: number;
  id_usuario: number;
  fecha_hora: string;
  hora_recogida: string | null;
  estado: PedidoEstado | string;
  total: number;
  codigo_unico?: string;
  codigo_pedido?: string; // compatibilidad
}

export interface OrderProduct {
  id_producto: number;
  cantidad: number;
}

export interface CreateOrderRequest {
  productos: OrderProduct[];
  hora_recogida: string;
  puntos_usados: number;
}

export interface CreateOrderResponse {
  codigo_pedido: string;
  puntos_ganados: number;
  puntos_totales: number;
  total: number;
}

export interface OrderHistoryItem {
  // campos opcionales para cubrir todos los templates existentes
  id_pedido?: number;
  codigo_unico?: string;
  codigo_pedido?: string;
  fecha_hora?: string;
  hora_recogida?: string | null;
  total: number;
  estado?: string;
  producto?: string;
}

const API_BASE = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private apiUrl = `${API_BASE}/orders`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /** CLIENTE: crear pedido */
  createOrder(body: CreateOrderRequest): Observable<CreateOrderResponse> {
    return this.http.post<CreateOrderResponse>(
      `${this.apiUrl}`,
      body,
      { headers: this.getAuthHeaders() }
    );
  }

  /** CLIENTE: historial de pedidos del usuario (array directo) */
  getOrderHistory(): Observable<OrderHistoryItem[]> {
    return this.http.get<OrderHistoryItem[]>(
      `${this.apiUrl}/history`,
      { headers: this.getAuthHeaders() }
    );
  }

  /** ADMIN: pendientes */
  getPendingOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(
      `${this.apiUrl}/pending`,
      { headers: this.getAuthHeaders() }
    );
  }

  /** ADMIN: cambiar estado */
  updateStatus(idPedido: number, status: PedidoEstado): Observable<Order> {
    return this.http.patch<Order>(
      `${this.apiUrl}/${idPedido}/status`,
      { status },
      { headers: this.getAuthHeaders() }
    );
  }
}
