// frontend/src/app/services/promotion.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Promotion {
  id_promocion: number;
  codigo: string;
  descuento: number;
  descripcion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PromotionService {
  private API_URL = 'http://localhost:3000/api/promotions';

  constructor(private http: HttpClient) {}

  getPromotions(): Observable<Promotion[]> {
    return this.http.get<Promotion[]>(this.API_URL);
  }

  createPromotion(promo: { codigo: string; descuento: number; descripcion?: string }): Observable<Promotion> {
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.post<Promotion>(this.API_URL, promo, { headers });
  }

  updatePromotion(
    id: number,
    promo: { codigo: string; descuento: number; descripcion?: string }
  ): Observable<Promotion> {
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.put<Promotion>(`${this.API_URL}/${id}`, promo, { headers });
  }

  deletePromotion(id: number): Observable<void> {
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.delete<void>(`${this.API_URL}/${id}`, { headers });
  }

  // Para validar código promocional desde payment-confirmation
  validateCode(code: string): Observable<{ valid: boolean; descuento: number }> {
    return this.http.get<{ valid: boolean; descuento: number }>(`${this.API_URL}/validate/${code}`);
  }
}
