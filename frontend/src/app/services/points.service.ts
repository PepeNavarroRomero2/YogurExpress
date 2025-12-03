import { Injectable } from '@angular/core';
import { AuthService, User } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PointsService {
  constructor(private auth: AuthService) {}

  /**
   * Devuelve los puntos del usuario actualmente logueado.
   */
  getPoints(): number {
    const user = this.auth.getUser();
    return user?.points ?? 0;
  }

  /**
   * Añade puntos al usuario actual y persiste los cambios en localStorage.
   * @param pts Número de puntos a sumar
   */
  addPoints(pts: number): void {
    const user = this.auth.getUser();
    if (!user) return;
    user.points = (user.points ?? 0) + pts;
    this.persistUser(user);
  }

  /**
   * Canjea puntos del usuario actual si hay saldo suficiente.
   * @param pts Número de puntos a canjear
   * @returns true si la operación tuvo éxito, false si no hay puntos suficientes
   */
  redeemPoints(pts: number): boolean {
    const user = this.auth.getUser();
    if (!user || (user.points ?? 0) < pts) {
      return false;
    }
    user.points -= pts;
    this.persistUser(user);
    return true;
  }

  /** Guarda el estado actualizado del usuario en localStorage */
  private persistUser(user: User): void {
    // Actualiza sólo el array de usuarios registrados (sin tocar al admin)
    const stored = localStorage.getItem('users');
    const users: User[] = stored ? JSON.parse(stored) : [];
    const idx = users.findIndex(u => u.email === user.email);
    if (idx > -1) {
      users[idx] = user;
      localStorage.setItem('users', JSON.stringify(users));
    }
    // Actualiza también currentUser
    localStorage.setItem('currentUser', JSON.stringify(user));
  }
}

