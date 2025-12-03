import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

/** Datos del usuario segÃºn backend */
export interface User {
  id_usuario: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'cliente';
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
  private AUTH_API  = '/api/auth';
  private USERS_API = '/api/users';

  /** Storage keys */
  private TOKEN_KEY = 'auth_token';
  private USER_KEY  = 'current_user';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Auth calls â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  register(nombre: string, email: string, password: string): Observable<AuthResponse> {
    const body = { nombre, email, password };
    return this.http.post<AuthResponse>(`${this.AUTH_API}/register`, body).pipe(
      tap(res => { this.setToken(res.token); this.setUser(res.user); })
    );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    const body = { email, password };
    return this.http.post<AuthResponse>(`${this.AUTH_API}/login`, body).pipe(
      tap(res => { this.setToken(res.token); this.setUser(res.user); })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.router.navigate(['/user/login']);
  }

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Token & User helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
    return raw ? (JSON.parse(raw) as User) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const u = this.getCurrentUser();
    return !!u && u.rol === 'admin';
  }

  /** Decodifica el payload del JWT (best-effort) */
  private getTokenPayload(): any | null {
    const t = this.getToken();
    if (!t) return null;
    try {
      const base64 = t.split('.')[1];
      if (!base64) return null;
      const json = atob(base64);
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  /** Devuelve true si el token no existe o estÃ¡ expirado/corrupto */
  isTokenExpired(): boolean {
    const p = this.getTokenPayload();
    if (!p || !p.exp) return true; // si no podemos leer exp, tratamos como invÃ¡lido
    const expiresAtMs = p.exp * 1000;
    return Date.now() >= expiresAtMs;
  }

  /** Cabeceras con Authorization (Bearer <token>) */
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken() || '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /** Refresca perfil desde backend y actualiza storage */
  fetchProfile(): Observable<User> {
    return this.http
      .get<User>(`${this.USERS_API}/profile`, { headers: this.getAuthHeaders() })
      .pipe(tap(user => this.setUser(user)));
  }
}



