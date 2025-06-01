import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-register.component.html',
  styleUrls: ['./login-register.component.scss']
})
export class LoginRegisterComponent {
  isLoginMode = true;
  name = '';
  email = '';
  password = '';

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.name = '';
    this.email = '';
    this.password = '';
  }

  onSubmit() {
    if (this.isLoginMode) {
      // Intento de login
      if (this.auth.login(this.email, this.password)) {
        const user = this.auth.getUser();
        if (user?.role === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/user/menu']);
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error de autenticación',
          text: 'Email o contraseña incorrectos.'
        });
      }
    } else {
      // Registro de nuevo usuario
      if (!this.name.trim()) {
        Swal.fire('Error', 'El nombre es obligatorio.', 'error');
        return;
      }
      if (this.auth.register(this.name, this.email, this.password)) {
        Swal.fire('¡Registro exitoso!', 'Ya puedes iniciar sesión.', 'success')
          .then(() => this.toggleMode());
      } else {
        Swal.fire('Error', 'El email ya está registrado.', 'error');
      }
    }
  }
}
