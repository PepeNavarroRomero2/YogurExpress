import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Promotion {
  id_promocion: number;
  codigo: string;
  descuento: number;
  descripcion?: string;
}

@Injectable({ providedIn: 'root' })
export class PromotionService {
  private API_URL = '/api/promotions';
  constructor(private http: HttpClient, private auth: AuthService) {}

  // PÃºblicas
  getPromotions(): Observable<Promotion[]> {
    return this.http.get<Promotion[]>(this.API_URL);
  }

  /** Backend expone /check?code=XXXX */
  validateCode(code: string): Observable<{ id_promocion: number; codigo: string; descuento: number; descripcion?: string }> {
    return this.http.get<{ id_promocion: number; codigo: string; descuento: number; descripcion?: string }>(
      `${this.API_URL}/check?code=${encodeURIComponent(code)}`
    );
  }

  // Admin-only (aÃ±adimos Authorization)
  createPromotion(promo: Omit<Promotion,'id_promocion'>): Observable<Promotion> {
    return this.http.post<Promotion>(this.API_URL, promo, { headers: this.auth.getAuthHeaders() });
  }

  updatePromotion(id: number, promo: Partial<Promotion>): Observable<Promotion> {
    return this.http.put<Promotion>(`${this.API_URL}/${id}`, promo, { headers: this.auth.getAuthHeaders() });
  }

  deletePromotion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`, { headers: this.auth.getAuthHeaders() });
  }
}

