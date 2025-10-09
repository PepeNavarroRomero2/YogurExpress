import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, combineLatest, interval, map, startWith, tap } from 'rxjs';

export interface Schedule {
  openHour: number;
  closeHour: number;
  minLeadMinutes: number;
}

const DEFAULT_SCHEDULE: Schedule = { openHour: 10, closeHour: 22, minLeadMinutes: 30 };
const API_BASE = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private readonly url = `${API_BASE}/settings/schedule`;
  private readonly subj = new BehaviorSubject<Schedule>(DEFAULT_SCHEDULE);
  readonly schedule$ = this.subj.asObservable();

  readonly isOpen$ = combineLatest([
    this.schedule$,
    interval(30000).pipe(startWith(0))
  ]).pipe(map(([cfg]) => this.isOpenAt(new Date(), cfg)));

  constructor(private http: HttpClient) {
    this.fetch();
  }

  get value(): Schedule {
    return this.subj.value;
  }

  fetch(): void {
    this.http.get<Schedule>(this.url).subscribe({
      next: (s) => this.subj.next(this.sanitize(s)),
      error: () => {}
    });
  }

  saveAdmin(schedule: Schedule) {
    const body = this.sanitize(schedule);
    const token = localStorage.getItem('auth_token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.put<Schedule>(this.url, body, { headers }).pipe(
      tap(saved => this.subj.next(this.sanitize(saved)))
    );
  }

  isOpenNow(): boolean {
    return this.isOpenAt(new Date(), this.value);
  }

  private isOpenAt(date: Date, cfg: Schedule): boolean {
    const d = new Date(date);
    const open = new Date(d); open.setHours(cfg.openHour, 0, 0, 0);
    const close = new Date(d); close.setHours(cfg.closeHour, 0, 0, 0);
    return d >= open && d <= close;
  }

  private sanitize(input: Partial<Schedule>): Schedule {
    let open  = Number.isFinite(input.openHour as number) ? Number(input.openHour) : DEFAULT_SCHEDULE.openHour;
    let close = Number.isFinite(input.closeHour as number) ? Number(input.closeHour) : DEFAULT_SCHEDULE.closeHour;
    let lead  = Number.isFinite(input.minLeadMinutes as number) ? Math.floor(Number(input.minLeadMinutes as number)) : DEFAULT_SCHEDULE.minLeadMinutes;

    open  = Math.max(0, Math.min(23, open));
    close = Math.max(1, Math.min(24, close));
    lead  = Math.max(0, Math.min(240, lead));
    if (open >= close) close = Math.min(24, open + 1);

    return { openHour: open, closeHour: close, minLeadMinutes: lead };
  }
}
