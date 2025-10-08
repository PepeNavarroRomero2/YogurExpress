import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

/** Datos del usuario según backend */
export interface User {
  id_usuario: number;
  nombre: string;
  email: string;
  rol: string;      // 'admin' | 'cliente'
  puntos: number;
}

/** Respuesta de login/register */
export interface AuthResponse {
  user: User;
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  /** APIs */
  private AUTH_API = 'http://localhost:3000/api/auth';
  private USERS_API = 'http://localhost:3000/api/users';

  /** Storage keys */
  private TOKEN_KEY = 'auth_token';
  private USER_KEY  = 'current_user';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  // ─────────── Auth calls ───────────

  register(nombre: string, email: string, contraseña: string): Observable<AuthResponse> {
    const body = { nombre, email, contraseña };
    return this.http.post<AuthResponse>(`${this.AUTH_API}/register`, body).pipe(
      tap(res => {
        this.setToken(res.token);
        this.setUser(res.user);
      })
    );
  }

  login(email: string, contraseña: string): Observable<AuthResponse> {
    const body = { email, contraseña };
    return this.http.post<AuthResponse>(`${this.AUTH_API}/login`, body).pipe(
      tap(res => {
        this.setToken(res.token);
        this.setUser(res.user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.router.navigate(['/user/login']);
  }

  // ─────────── Token & User helpers ───────────

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }
  getCurrentUser(): User | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) as User : null;
  }

  /** True si hay token */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /** True si el usuario actual es admin */
  isAdmin(): boolean {
    const u = this.getCurrentUser();
    return !!u && u.rol === 'admin';
  }

  /** Cabeceras con Authorization */
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken() || '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /** Refresca perfil desde el backend y actualiza storage */
  fetchProfile(): Observable<User> {
    return this.http.get<User>(`${this.USERS_API}/profile`, { headers: this.getAuthHeaders() })
      .pipe(tap(user => this.setUser(user)));
  }
}
