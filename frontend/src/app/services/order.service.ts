import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface OrderProduct {
  id_producto: number;
  cantidad: number;
}

export interface CreateOrderRequest {
  productos: OrderProduct[];
  hora_recogida: string;   // “HH:MM”
  puntos_usados: number;
}

export interface CreateOrderResponse {
  id_pedido: number;
  codigo_pedido: string;
  total: number;
  earned: number;
}

export interface OrderDetail {
  id_producto: number;
  cantidad: number;
  productos: {
    nombre: string;
    precio: number;
    tipo: string;
  };
}

export interface Order {
  id_pedido: number;
  fecha_hora: string;
  hora_recogida: string;
  estado: string;
  total: number;
  codigo_pedido: string;
  detalle_pedido: OrderDetail[];
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private API_URL = 'http://localhost:3000/api/orders';

  constructor(private http: HttpClient, private auth: AuthService) { }

  /** POST /api/orders (cuerpo CreateOrderRequest) */
  createOrder(orderData: CreateOrderRequest): Observable<CreateOrderResponse> {
    const headers: HttpHeaders = this.auth.getAuthHeaders();
    return this.http.post<CreateOrderResponse>(this.API_URL, orderData, { headers });
  }

  /** GET /api/orders/history */
  getOrderHistory(): Observable<Order[]> {
    const headers: HttpHeaders = this.auth.getAuthHeaders();
    return this.http.get<Order[]>(`${this.API_URL}/history`, { headers });
  }
}
