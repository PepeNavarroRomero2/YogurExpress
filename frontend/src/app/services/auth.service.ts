// src/app/services/auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

/**
 * Interfaz que representa los datos del usuario que recibimos del backend.
 */
export interface User {
  id_usuario: number;
  nombre: string;
  email: string;
  rol: string;
  puntos: number;
}

/**
 * Interfaz para la respuesta del login/register: viene con el token y el User.
 */
export interface AuthResponse {
  user: User;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // URL base de tu API de autenticación
  private API_URL = 'http://localhost:3000/api/auth';
  // Clave en localStorage donde guardamos el objeto User (stringificado)
  private userKey = 'current_user';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  /**
   * Registra un nuevo usuario. Al registrarse, guardamos token y usuario en localStorage.
   */
  register(nombre: string, email: string, contraseña: string): Observable<AuthResponse> {
    const body = { nombre, email, contraseña };
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, body).pipe(
      tap(res => {
        this.setToken(res.token);
        this.setUserInStorage(res.user);
      })
    );
  }

  /**
   * Hace login: al autenticar correctamente, guardamos token y usuario en localStorage.
   */
  login(email: string, contraseña: string): Observable<AuthResponse> {
    const body = { email, contraseña };
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, body).pipe(
      tap(res => {
        this.setToken(res.token);
        this.setUserInStorage(res.user);
      })
    );
  }

  /**
   * Almacenamos el token JWT en localStorage.
   */
  private setToken(token: string) {
    localStorage.setItem('auth_token', token);
  }

  /**
   * Guardamos el objeto User (stringificado) en localStorage.
   */
  private setUserInStorage(user: User) {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  /**
   * Devuelve el token (o null si no existe).
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Indica si el usuario está autenticado (si existe token en localStorage).
   */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /**
   * Hace logout: borramos token y user, y redirigimos a la ruta de login.
   */
  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem(this.userKey);
    this.router.navigate(['/user/login']);
  }

  /**
   * Devuelve cabeceras con Authorization para peticiones privadas.
   */
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken() || '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Devuelve el objeto User si está en localStorage, o null si no.
   */
  getCurrentUser(): User | null {
    const raw = localStorage.getItem(this.userKey);
    return raw ? JSON.parse(raw) as User : null;
  }
}
