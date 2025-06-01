// frontend/src/app/components/user/select-time/select-time.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';    // ← NgIf
import { FormsModule } from '@angular/forms';      // ← ngModel
import { RouterModule, Router } from '@angular/router';
import Swal from 'sweetalert2';

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
export class SelectTimeComponent {
  hora: string = '';

  constructor(private router: Router) {}

  onConfirm() {
    if (!this.hora) {
      Swal.fire('Error', 'Debes seleccionar una hora de recogida.', 'error');
      return;
    }
    localStorage.setItem('pickup_time', this.hora);
    this.router.navigate(['/user/payment']);
  }
}
