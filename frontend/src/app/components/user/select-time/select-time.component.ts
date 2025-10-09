import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';
import { CartService } from '../../../services/cart.service';
import { ScheduleService } from '../../../services/schedule.service';

@Component({
  selector: 'app-select-time',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './select-time.component.html',
  styleUrls: ['./select-time.component.scss']
})
export class SelectTimeComponent implements OnInit, OnDestroy {
  hora: string | null = null;

  openHour = 10;
  closeHour = 22;
  minLeadMinutes = 30;

  minAttr = '10:00';
  maxAttr = '22:00';

  private sub?: Subscription;

  constructor(
    private cartService: CartService,
    private router: Router,
    private schedule: ScheduleService
  ) {}

  ngOnInit(): void {
    this.sub = this.schedule.schedule$.subscribe(s => {
      this.openHour = s.openHour;
      this.closeHour = s.closeHour;
      this.minLeadMinutes = s.minLeadMinutes;
      this.updateMinMaxAttrs();
      this.ensureSuggestedTime();
    });

    this.ensureSuggestedTime();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  onConfirm(): void {
    if (!this.hora) {
      Swal.fire('Error', 'Debes seleccionar una hora de recogida.', 'error');
      return;
    }

    const selected = this.todayWithTime(this.hora);
    const minAllowed = new Date(Date.now() + this.minLeadMinutes * 60000);

    if (selected < minAllowed) {
      Swal.fire('Hora no válida', `La recogida debe ser al menos dentro de ${this.minLeadMinutes} minutos.`, 'warning');
      return;
    }

    if (!this.isWithinScheduleDate(selected)) {
      Swal.fire(
        'Fuera de horario',
        `Nuestro horario es de ${this.pad(this.openHour)}:00 a ${this.pad(this.closeHour)}:00.`,
        'warning'
      );
      return;
    }

    this.cartService.setPickupTime(this.hora);
    this.router.navigate(['/user/payment']);
  }

  private ensureSuggestedTime(): void {
    const now = new Date();
    const suggested = new Date(now.getTime() + this.minLeadMinutes * 60000);

    let candidate: Date;
    if (this.isWithinScheduleDate(suggested)) {
      candidate = suggested;
    } else {
      const open = new Date();
      open.setHours(this.openHour, 0, 0, 0);
      candidate = open;
    }

    if (!this.hora || !this.isWithinScheduleDate(this.todayWithTime(this.hora))) {
      this.hora = this.toHHMM(candidate);
    }
  }

  private updateMinMaxAttrs(): void {
    this.minAttr = `${this.pad(this.openHour)}:00`;
    this.maxAttr = `${this.pad(this.closeHour)}:00`;
  }

  private todayWithTime(hhmm: string): Date {
    const [hh, mm] = hhmm.split(':').map(Number);
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
}
