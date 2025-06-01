import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

export interface User {
  id_usuario: number;
  nombre: string;
  email: string;
  rol: string;
  puntos: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private API_URL = 'http://localhost:3000/api/auth';

  constructor(private http: HttpClient, private router: Router) {}

  /** REGISTRO: llama a POST /api/auth/register y guarda el token automáticamente */
  register(nombre: string, email: string, contraseña: string): Observable<AuthResponse> {
    const body = { nombre, email, contraseña };
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, body).pipe(
      tap(res => {
        this.setToken(res.token);
      })
    );
  }

  /** LOGIN: llama a POST /api/auth/login y guarda el token automáticamente */
  login(email: string, contraseña: string): Observable<AuthResponse> {
    const body = { email, contraseña };
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, body).pipe(
      tap(res => {
        this.setToken(res.token);
      })
    );
  }

  /** Guarda el JWT en localStorage */
  private setToken(token: string) {
    localStorage.setItem('auth_token', token);
  }

  /** Recupera el JWT de localStorage */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /** Comprueba si hay token en localStorage */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /** Elimina el JWT y redirige al login */
  logout() {
    localStorage.removeItem('auth_token');
    this.router.navigate(['/user/login']);
  }

  /** Headers con JWT para llamadas protegidas */
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken() || '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
}