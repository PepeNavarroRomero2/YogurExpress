// frontend/src/app/components/user/select-time/select-time.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { CartService } from '../../../services/cart.service';

@Component({
  selector: 'app-select-time',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './select-time.component.html',
  styleUrls: ['./select-time.component.scss']
})
export class SelectTimeComponent implements OnInit {
  hora: string = ''; // enlazado con [(ngModel)] del <input type="time">

  constructor(
    private cartService: CartService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Comprobamos que flavor y size estén en el carrito
    const flavor = this.cartService.getFlavor();
    const size = this.cartService.getSize();
    if (!flavor || !size) {
      this.router.navigate(['/user/personalize']);
      return;
    }

    // Precargamos la hora si ya existe
    const savedTime: string | null = this.cartService.getPickupTime();
    if (savedTime) {
      this.hora = savedTime;
    } else {
      // Tomamos la hora actual en formato "HH:MM"
      const now = new Date();
      const hh = now.getHours().toString().padStart(2, '0');
      const mm = now.getMinutes().toString().padStart(2, '0');
      this.hora = `${hh}:${mm}`;
    }
  }

  onConfirm(): void {
    if (!this.hora) {
      Swal.fire('Error', 'Debes seleccionar una hora de recogida.', 'error');
      return;
    }
    this.cartService.setPickupTime(this.hora);
    this.router.navigate(['/user/payment']);
  }
}
