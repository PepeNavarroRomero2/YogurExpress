// frontend/src/app/components/user/select-time/select-time.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';    // ← NgIf
import { FormsModule } from '@angular/forms';      // ← ngModel
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
  hora: string = '';

  constructor(
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const flavor = this.cartService.getFlavor();
    const size   = this.cartService.getSize();
    if (!flavor || !size) {
      // Si no hay sabor o tamaño, volvemos al menú
      this.router.navigate(['/user/menu']);
    }
  }

  onConfirm() {
    if (!this.hora) {
      Swal.fire('Error', 'Debes seleccionar una hora de recogida.', 'error');
      return;
    }

    // Guardamos la hora en el servicio
    this.cartService.setPickupTime(this.hora);

    // Redirigimos a /user/payment (según UserRoutingModule)
    this.router.navigate(['/user/payment']);
  }
}
