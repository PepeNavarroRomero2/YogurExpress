import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Order {
  id_pedido: number;
  id_usuario: number;
  fecha_hora: string;
  hora_recogida: string;
  estado: string;
  total: number;
  codigo_pedido: string;
}

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
  ) {}

  private getAuthHeaders(): HttpHeaders {
    return this.authService.getAuthHeaders();
  }

  /** Devuelve todos los pedidos (solo admin) */
  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(
      `${this.apiUrl}`,
      { headers: this.getAuthHeaders() }
    );
  }

  /** Marca un pedido con un nuevo estado */
  updateOrderStatus(id: number, status: string): Observable<Order> {
    const headers = this.getAuthHeaders().set('Content-Type', 'application/json');
    return this.http.patch<Order>(
      `${this.apiUrl}/${id}/status`,
      { status },
      { headers }
    );
  }

  /** Crea nuevo pedido (cliente) */
  createOrder(body: CreateOrderRequest): Observable<CreateOrderResponse> {
    return this.http.post<CreateOrderResponse>(
      `${this.apiUrl}`,
      body,
      { headers: this.getAuthHeaders() }
    );
  }

  /** Historial de pedidos del usuario (cliente) */
  getOrderHistory(): Observable<{ history: OrderHistoryItem[] }> {
    return this.http.get<{ history: OrderHistoryItem[] }>(
      `${this.apiUrl}/history`,
      { headers: this.getAuthHeaders() }
    );
  }
}
