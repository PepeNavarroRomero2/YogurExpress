import { Injectable } from '@angular/core';

export type UserRole = 'user' | 'admin';

export interface User {
  name?: string;
  email: string;
  password: string;
  points: number;
  role: UserRole;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private localUsers: User[] = [];
  private users: User[] = [];
  private currentUser?: User;

  // Usuario administrador por defecto
  private defaultAdmin: User = {
    name: 'Admin',
    email: 'admin@yogurtexpress.com',
    password: 'admin123',
    points: 0,
    role: 'admin'
  };

  constructor() {
    const saved = localStorage.getItem('users');
    this.localUsers = saved ? JSON.parse(saved) : [];
    // Siempre tenemos al admin primero, más los usuarios registrados
    this.users = [this.defaultAdmin, ...this.localUsers];

    const savedCurrent = localStorage.getItem('currentUser');
    this.currentUser = savedCurrent ? JSON.parse(savedCurrent) : undefined;
  }

  login(email: string, password: string): boolean {
    const user = this.users.find(u => u.email === email && u.password === password);
    if (user) {
      this.currentUser = user;
      localStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    }
    return false;
  }

  register(name: string, email: string, password: string): boolean {
    // Sólo registramos usuarios con rol 'user'
    if (this.localUsers.some(u => u.email === email)) {
      return false;
    }
    const newUser: User = { name, email, password, points: 0, role: 'user' };
    this.localUsers.push(newUser);
    localStorage.setItem('users', JSON.stringify(this.localUsers));
    this.users = [this.defaultAdmin, ...this.localUsers];
    return true;
  }

  logout(): void {
    this.currentUser = undefined;
    localStorage.removeItem('currentUser');
  }

  isLoggedIn(): boolean {
    return !!this.currentUser;
  }

  getUser(): User | undefined {
    return this.currentUser;
  }
}
