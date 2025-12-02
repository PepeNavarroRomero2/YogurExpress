import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ScheduleService } from '../../../../services/schedule.service';
import { AuthService } from '../../../../services/auth.service';
import { CartService } from '../../../../services/cart.service';

@Component({
  selector: 'app-store-closed-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './store-closed-overlay.component.html',
  styleUrls: ['./store-closed-overlay.component.scss']
})
export class StoreClosedOverlayComponent {
  constructor(
    public schedule: ScheduleService,
    private auth: AuthService,
    private cart: CartService,
    private router: Router
  ) {}

  pad(n: number): string {
    return n.toString().padStart(2, '0');
  }

  logout(): void {
    this.auth.logout();
    this.cart.clear();
    this.router.navigate(['/user/login']);
  }
}

