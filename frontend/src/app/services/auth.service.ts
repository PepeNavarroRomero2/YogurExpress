// src/app/services/auth.service.ts

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
  private userKey = 'current_user';

  constructor(private http: HttpClient, private router: Router) {}

  register(nombre: string, email: string, contraseña: string): Observable<AuthResponse> {
    const body = { nombre, email, contraseña };
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, body).pipe(
      tap(res => {
        this.setToken(res.token);
        this.setUserInStorage(res.user);
      })
    );
  }

  login(email: string, contraseña: string): Observable<AuthResponse> {
    const body = { email, contraseña };
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, body).pipe(
      tap(res => {
        this.setToken(res.token);
        this.setUserInStorage(res.user);
      })
    );
  }

  private setToken(token: string) {
    localStorage.setItem('auth_token', token);
  }

  private setUserInStorage(user: User) {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem(this.userKey);
    this.router.navigate(['/user/login']);
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken() || '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getCurrentUser(): User | null {
    const raw = localStorage.getItem(this.userKey);
    return raw ? JSON.parse(raw) : null;
  }
}
