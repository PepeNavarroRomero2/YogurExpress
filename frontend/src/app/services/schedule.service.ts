import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, interval, map, startWith } from 'rxjs';
import { DEFAULT_SCHEDULE, type Schedule } from '../config/schedule.config';

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private readonly KEY = 'yogurexpress.schedule';
  private readonly subj = new BehaviorSubject<Schedule>(this.loadInitial());
  readonly schedule$ = this.subj.asObservable();

  // Emite true/false según esté abierto ahora mismo (se actualiza cada 30s)
  readonly isOpen$ = combineLatest([
    this.schedule$,
    interval(30000).pipe(startWith(0))
  ]).pipe(
    map(([cfg]) => this.isOpenAt(new Date(), cfg))
  );

  get value(): Schedule {
    return this.subj.value;
  }

  set(schedule: Schedule): void {
    const next = this.sanitize(schedule, true);
    this.subj.next(next);
    this.save(next);
  }

  update(partial: Partial<Schedule>): void {
    const next = this.sanitize({ ...this.value, ...partial });
    this.subj.next(next);
    this.save(next);
  }

  reset(): void {
    this.subj.next(DEFAULT_SCHEDULE);
    this.save(DEFAULT_SCHEDULE);
  }

  // Helpers de estado
  isOpenNow(): boolean {
    return this.isOpenAt(new Date(), this.value);
  }

  isOpenAt(date: Date, cfg: Schedule = this.value): boolean {
    const d = new Date(date);
    const open = new Date(d);  open.setHours(cfg.openHour, 0, 0, 0);
    const close = new Date(d); close.setHours(cfg.closeHour, 0, 0, 0);
    return d >= open && d <= close;
  }

  // Internos
  private loadInitial(): Schedule {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return this.sanitize(parsed, true);
      }
    } catch {}
    return DEFAULT_SCHEDULE;
  }

  private save(s: Schedule): void {
    localStorage.setItem(this.KEY, JSON.stringify(s));
  }

  private sanitize(input: Partial<Schedule>, fillDefaults = false): Schedule {
    const base = fillDefaults ? DEFAULT_SCHEDULE : this.value;

    let open  = Number.isFinite(input.openHour as number) ? Number(input.openHour) : base.openHour;
    let close = Number.isFinite(input.closeHour as number) ? Number(input.closeHour) : base.closeHour;
    let lead  = Number.isFinite(input.minLeadMinutes as number) ? Math.floor(Number(input.minLeadMinutes)) : base.minLeadMinutes;

    open  = Math.max(0,  Math.min(23, open));
    close = Math.max(1,  Math.min(24, close));
    lead  = Math.max(0,  Math.min(240, lead));

    if (open >= close) {
      if (fillDefaults) {
        open = DEFAULT_SCHEDULE.openHour;
        close = DEFAULT_SCHEDULE.closeHour;
      } else {
        close = Math.min(24, open + 1);
      }
    }

    return { openHour: open, closeHour: close, minLeadMinutes: lead };
  }
}
