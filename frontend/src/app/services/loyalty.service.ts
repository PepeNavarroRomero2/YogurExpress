import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';

export interface LoyaltySettings {
  /** Puntos que se ganan por cada € pagado (tras canje) */
  earnRate: number;
  /** Puntos necesarios para descontar 1 € (ej: 10 = 10 puntos → 1 €) */
  pointsPerEuro: number;
}

const DEFAULT_LOYALTY: LoyaltySettings = { earnRate: 1, pointsPerEuro: 10 };
const API_BASE = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class LoyaltyService {
  private readonly url = `${API_BASE}/settings/loyalty`;
  private _state = new BehaviorSubject<LoyaltySettings>(DEFAULT_LOYALTY);
  readonly state$ = this._state.asObservable();

  get value(): LoyaltySettings {
    return this._state.value;
  }

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
    // (No enviamos Content-Type en GET para evitar preflight innecesario)
  }

  load() {
    return this.http.get<LoyaltySettings>(this.url, { headers: this.getAuthHeaders() })
      .pipe(tap(cfg => {
        this._state.next(this.sanitize(cfg));
      }));
  }

  save(next: Partial<LoyaltySettings>) {
    const payload = this.sanitize(next);
    return this.http.put<LoyaltySettings>(this.url, payload, { headers: this.getAuthHeaders().set('Content-Type','application/json') })
      .pipe(tap(cfg => this._state.next(this.sanitize(cfg))));
  }

  sanitize(input: Partial<LoyaltySettings>): LoyaltySettings {
    let earn = Number.isFinite(input.earnRate as number) ? Number(input.earnRate) : this._state.value.earnRate;
    let ppe  = Number.isFinite(input.pointsPerEuro as number) ? Math.floor(Number(input.pointsPerEuro)) : this._state.value.pointsPerEuro;
    earn = Math.max(0, Math.min(100, earn));
    ppe  = Math.max(1, Math.min(10000, ppe));
    return { earnRate: earn, pointsPerEuro: ppe };
  }
}
