import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService, User } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private API_URL = 'http://localhost:3000/api/users';

  constructor(private http: HttpClient, private auth: AuthService) { }

  /** GET /api/users/me */
  getProfile(): Observable<User> {
    const headers: HttpHeaders = this.auth.getAuthHeaders();
    return this.http.get<User>(`${this.API_URL}/me`, { headers });
  }
}
