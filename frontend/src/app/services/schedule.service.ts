import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  BehaviorSubject,
  combineLatest,
  interval,
  map,
  startWith,
  tap,
  switchMap,
  Subscription,
} from 'rxjs';

export interface Schedule {
  openHour: number;
  closeHour: number;
  minLeadMinutes: number;
}

const DEFAULT_SCHEDULE: Schedule = { openHour: 10, closeHour: 22, minLeadMinutes: 30 };
const API_BASE = '/api';

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private readonly url = `${API_BASE}/settings/schedule`;

  private subj = new BehaviorSubject<Schedule>(DEFAULT_SCHEDULE);
  /** Observable público del horario (los componentes se suscriben a esto) */
  readonly schedule$ = this.subj.asObservable();

  /** Indica si AHORA mismo estamos dentro del horario (se recalcula cada minuto) */
  readonly isOpen$ = combineLatest([
    this.subj.asObservable(),
    interval(60_000).pipe(startWith(0))
  ]).pipe(
    map(([s]) => this.isOpenNow(s))
  );

  private refreshSub?: Subscription;

  constructor(private http: HttpClient) {}

  /** Valor actual del horario en memoria */
  get value(): Schedule {
    return this.subj.value;
  }

  /** Carga única del horario (por si quieres llamarla manualmente) */
  fetch(): void {
    this.http.get<Schedule>(this.url, { headers: this.getAuthHeaders() })
      .subscribe({
        next: (s) => this.setIfChanged(this.sanitize(s)),
        error: () => { /* fallback: dejamos DEFAULT */ }
      });
  }

  /**
   * Arranca un auto-refresh que:
   *  - Hace un GET inicial inmediatamente
   *  - Repite cada `periodMs` (por defecto 60s)
   *  - Solo emite si cambia realmente el horario (evita renders inútiles)
   */
  startAutoRefresh(periodMs = 60_000): void {
    if (this.refreshSub) return; // ya está activo
    this.refreshSub = interval(periodMs).pipe(
      startWith(0),
      switchMap(() => this.http.get<Schedule>(this.url, { headers: this.getAuthHeaders() }))
    ).subscribe({
      next: (s) => this.setIfChanged(this.sanitize(s)),
      error: () => { /* silencio para no spamear consola del cliente */ }
    });
  }

  /** Para Admin: guardar y propagar a todos los clientes (subj.next) */
  saveAdmin(next: Schedule) {
    const body = this.sanitize(next);
    return this.http.put<Schedule>(this.url, body, {
      headers: this.getAuthHeaders().set('Content-Type', 'application/json')
    }).pipe(
      tap((s) => this.setIfChanged(this.sanitize(s)))
    );
  }

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private setIfChanged(next: Schedule): void {
    const cur = this.subj.value;
    if (cur.openHour !== next.openHour ||
        cur.closeHour !== next.closeHour ||
        cur.minLeadMinutes !== next.minLeadMinutes) {
      this.subj.next(next);
    }
  }

  private isOpenNow(s: Schedule): boolean {
    const now = new Date();
    const h = now.getHours() + now.getMinutes() / 60;
    return h >= s.openHour && h < s.closeHour;
  }

  private sanitize(input: Partial<Schedule>): Schedule {
    let open  = Number.isFinite(input.openHour as number) ? Number(input.openHour) : DEFAULT_SCHEDULE.openHour;
    let close = Number.isFinite(input.closeHour as number) ? Number(input.closeHour) : DEFAULT_SCHEDULE.closeHour;
    let lead  = Number.isFinite(input.minLeadMinutes as number) ? Math.floor(Number(input.minLeadMinutes)) : DEFAULT_SCHEDULE.minLeadMinutes;

    open  = Math.max(0, Math.min(23, open));
    close = Math.max(1, Math.min(24, close));
    lead  = Math.max(0, Math.min(240, lead));
    if (open >= close) close = Math.min(24, open + 1);

    return { openHour: open, closeHour: close, minLeadMinutes: lead };
  }
}

