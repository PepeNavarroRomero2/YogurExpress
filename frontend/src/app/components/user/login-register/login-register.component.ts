// frontend/src/app/components/user/login-register/login-register.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';      // ← para NgIf
import { FormsModule } from '@angular/forms';        // ← para ngModel
import { RouterModule, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './login-register.component.html',
  styleUrls: ['./login-register.component.scss']
})
export class LoginRegisterComponent {
  isLoginMode = true;

  name: string = '';
  email: string = '';
  password: string = '';

  constructor(private auth: AuthService, private router: Router) { }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.name = '';
    this.email = '';
    this.password = '';
  }

  onSubmit() {
    if (this.isLoginMode) {
      // --- LOGIN ---
      if (!this.email.trim() || !this.password.trim()) {
        Swal.fire('Error', 'Email y contraseña son obligatorios.', 'error');
        return;
      }
      this.auth.login(this.email, this.password).subscribe({
        next: res => {
          if (res.user.rol === 'admin') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/user/menu']);
          }
        },
        error: err => {
          const msg = err.error?.error || 'Credenciales inválidas';
          Swal.fire('Error', msg, 'error');
        }
      });
    } else {
      // --- REGISTRO ---
      if (!this.name.trim() || !this.email.trim() || !this.password.trim()) {
        Swal.fire('Error', 'Nombre, email y contraseña son obligatorios.', 'error');
        return;
      }
      this.auth.register(this.name, this.email, this.password).subscribe({
        next: res => {
          Swal.fire('¡Registro exitoso!', 'Ya puedes iniciar sesión.', 'success')
            .then(() => this.toggleMode());
        },
        error: err => {
          const msg = err.error?.error || 'No se pudo registrar';
          Swal.fire('Error', msg, 'error');
        }
      });
    }
  }
}
