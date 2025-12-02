import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';

import { CartService } from '../../../services/cart.service';
import { ScheduleService, Schedule } from '../../../services/schedule.service';

@Component({
  selector: 'app-select-time',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './select-time.component.html',
  styleUrls: ['./select-time.component.scss']
})
export class SelectTimeComponent implements OnInit, OnDestroy {
  // Estos valores vienen del servicio y se reflejan en la plantilla
  openHour!: number;
  closeHour!: number;
  minLeadMinutes!: number;

  // HH:mm seleccionado
  hora = '';

  // Atributos dinÃ¡micos del input time
  minAttr = '';
  maxAttr = '';

  private sub?: Subscription;
  private readonly STEP_MIN = 15; // minutos

  constructor(
    private cartService: CartService,
    private router: Router,
    private schedule: ScheduleService
  ) {}

  ngOnInit(): void {
    // Inicializamos con lo que haya en memoria (puede ser default al arrancar)
    this.applySchedule(this.schedule.value);

    // Auto-refresh: GET inicial + re-fetch cada 60s (sube o baja si quieres)
    this.schedule.startAutoRefresh(60_000);

    // Nos suscribimos a cambios para reaccionar en vivo a ajustes del admin
    this.sub = this.schedule.schedule$.subscribe((s: Schedule) => {
      this.applySchedule(s);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  /** Alias si tu template/otros llaman confirm() */
  confirm(): void { this.onConfirm(); }

  onConfirm(): void {
    if (!this.hora) {
      Swal.fire('Error', 'Debes seleccionar una hora de recogida.', 'error');
      return;
    }
    const selected = this.todayWithTime(this.hora);
    const minAllowed = new Date(Date.now() + this.minLeadMinutes * 60000);

    if (selected < minAllowed) {
      Swal.fire('Hora no vÃ¡lida', `La recogida debe ser al menos dentro de ${this.minLeadMinutes} minutos.`, 'warning');
      return;
    }
    if (!this.isWithinScheduleDate(selected)) {
      Swal.fire('Fuera de horario', `Nuestro horario es de ${this.pad(this.openHour)}:00 a ${this.pad(this.closeHour)}:00.`, 'warning');
      return;
    }

    // Guardamos HH:mm (tal y como espera tu flujo actual) y seguimos
    this.cartService.setPickupTime(this.hora);
    this.router.navigate(['/user/payment']);
  }

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

  private applySchedule(s: Schedule): void {
    this.openHour = s.openHour;
    this.closeHour = s.closeHour;
    this.minLeadMinutes = s.minLeadMinutes;
    this.updateMinMaxAttrs();
    this.ensureSuggestedTime();
  }

  private ensureSuggestedTime(): void {
    const now = new Date();
    const earliest = new Date(now.getTime() + this.minLeadMinutes * 60000);

    const open = new Date(now);  open.setHours(this.openHour, 0, 0, 0);
    const close = new Date(now); close.setHours(this.closeHour, 0, 0, 0);

    let start = new Date(Math.max(earliest.getTime(), open.getTime()));
    start = this.roundUpToStep(start, this.STEP_MIN);

    if (!this.hora || !this.isWithinScheduleDate(this.todayWithTime(this.hora))) {
      this.hora = (start >= close) ? '' : this.toHHMM(start);
    }
  }

  private updateMinMaxAttrs(): void {
    this.minAttr = `${this.pad(this.openHour)}:00`;
    this.maxAttr = `${this.pad(this.closeHour)}:00`;
  }

  private todayWithTime(hhmm: string): Date {
    const [hh, mm] = hhmm.split(':').map(n => parseInt(n, 10));
    const d = new Date();
    d.setHours(hh, mm, 0, 0);
    return d;
  }

  private isWithinScheduleDate(d: Date): boolean {
    const open = new Date(d);  open.setHours(this.openHour, 0, 0, 0);
    const close = new Date(d); close.setHours(this.closeHour, 0, 0, 0);
    return d >= open && d <= close;
  }

  private toHHMM(d: Date): string {
    return `${this.pad(d.getHours())}:${this.pad(d.getMinutes())}`;
  }

  private pad(n: number): string {
    return n.toString().padStart(2, '0');
  }

  private roundUpToStep(d: Date, stepMin: number): Date {
    const res = new Date(d);
    const mins = res.getMinutes();
    const rounded = Math.ceil(mins / stepMin) * stepMin;
    res.setMinutes(rounded, 0, 0);
    return res;
  }
}

