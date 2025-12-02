// frontend/src/app/components/user/points/points.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';    // para NgIf
import { RouterModule, Router } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { AuthService, User } from '../../../services/auth.service';

@Component({
  selector: 'app-points',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './points.component.html',
  styleUrls: ['./points.component.scss']
})
export class PointsComponent implements OnInit {
  puntos: number = 0;
  errorMsg: string = '';

  // Cambiado a 'public' para poder usar 'router' desde el HTML
  constructor(
    private userService: UserService,
    private authService: AuthService,
    public router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/user/login']);
      return;
    }
    this.userService.getProfile().subscribe({
      next: (user: User) => {
        this.puntos = user.puntos;
      },
      error: () => {
        this.errorMsg = 'No se pudieron cargar tus puntos.';
      }
    });
  }
}

