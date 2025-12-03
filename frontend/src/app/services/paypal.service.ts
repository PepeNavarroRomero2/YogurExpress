import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, map } from 'rxjs';

type PaypalConfig = { clientId: string; currency: string; env: 'sandbox' | 'live' };

type CreateOrderPayload =
  | { pedidoId: number; description?: string; puntos_usados?: number; pointsPerEuro?: number }
  | { items: Array<{ productId: number; qty: number }>; description?: string; puntos_usados?: number; pointsPerEuro?: number };

@Injectable({ providedIn: 'root' })
export class PaypalService {
  private base = '/api/paypal';

  constructor(private http: HttpClient) {}

  getConfig() {
    return firstValueFrom(
      this.http.get(`${this.base}/config`, { responseType: 'text' }).pipe(
        map((txt) => {
          try {
            return JSON.parse(txt) as PaypalConfig;
          } catch {
            return { clientId: '', currency: 'EUR', env: 'sandbox' } as PaypalConfig;
          }
        })
      )
    );
  }


  createOrder(payload: CreateOrderPayload) {
    return firstValueFrom(this.http.post<{ id: string }>(`${this.base}/orders`, payload));
  }

  captureOrder(orderId: string) {
    return firstValueFrom(this.http.post<{ status: string; captureId?: string; orderId: string }>(`${this.base}/orders/${orderId}/capture`, {}));
  }

  linkOrder(paypalOrderId: string, pedidoId: number) {
    return firstValueFrom(this.http.post<{ linked: boolean }>(`${this.base}/link-order`, { paypalOrderId, pedidoId }));
  }
}

