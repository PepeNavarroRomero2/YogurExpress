import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { CartService } from '../../../services/cart.service';

@Component({
  selector: 'app-select-time',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './select-time.component.html',
  styleUrls: ['./select-time.component.scss']
})
export class SelectTimeComponent implements OnInit {
  pickupTime = '';
  minDateTime = '';

  constructor(
    private cartSvc: CartService,
    private router: Router
  ) {}

  ngOnInit() {
    // Si no hay sabor ni personalización, volvemos atrás
    if (!this.cartSvc.getFlavor()) {
      this.router.navigate(['/user/menu']);
      return;
    }
    // Si ya había hora seleccionada, precargamos
    const existing = this.cartSvc.getPickupTime();
    if (existing) {
      this.pickupTime = this.formatLocal(existing);
    }
    // Mínimo: ahora + 15 minutos
    const now = new Date();
    now.setMinutes(now.getMinutes() + 15);
    this.minDateTime = this.formatLocal(now);
  }

  /** Formatea Date a string "YYYY-MM-DDTHH:mm" para input[type=datetime-local] */
  private formatLocal(d: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const YYYY = d.getFullYear();
    const MM   = pad(d.getMonth() + 1);
    const DD   = pad(d.getDate());
    const hh   = pad(d.getHours());
    const mm   = pad(d.getMinutes());
    return `${YYYY}-${MM}-${DD}T${hh}:${mm}`;
  }

  onSubmit() {
    if (!this.pickupTime) {
      Swal.fire('Error', 'Selecciona una fecha y hora de recogida.', 'error');
      return;
    }
    const dt = new Date(this.pickupTime);
    this.cartSvc.setPickupTime(dt);
    this.router.navigate(['/user/payment']);
  }

  onBack() {
    this.router.navigate(['/user/personalize']);
  }
}
