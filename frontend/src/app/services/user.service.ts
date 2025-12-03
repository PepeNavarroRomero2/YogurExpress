// src/app/services/user.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService, User } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = '/api/users';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    return this.authService.getAuthHeaders();
  }

  /** Obtiene datos del usuario (incluye puntos) */
  getProfile(): Observable<User> {
    return this.http.get<User>(
      `${this.apiUrl}/profile`,
      { headers: this.getAuthHeaders() }
    );
  }
}

