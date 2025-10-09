import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

import { ProductService, Flavor } from '../../../services/product.service';
import { CartService } from '../../../services/cart.service';
import { AuthService } from '../../../services/auth.service';
import { ScheduleService } from '../../../services/schedule.service';
import { StoreClosedOverlayComponent } from '../../shared/store-closed-overlay/store-closed-overlay/store-closed-overlay.component';

@Component({
  selector: 'app-product-menu',
  standalone: true,
  imports: [CommonModule, RouterModule, StoreClosedOverlayComponent],
  templateUrl: './product-menu.component.html',
  styleUrls: ['./product-menu.component.scss']
})
export class ProductMenuComponent implements OnInit, OnDestroy {
  flavors: Flavor[] = [];
  loading = false;
  errorMsg: string | null = null;

  isOpen = true;
  private sub?: Subscription;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private authService: AuthService,
    private router: Router,
    private schedule: ScheduleService
  ) {}

  ngOnInit(): void {
    this.isOpen = this.schedule.isOpenNow();
    this.sub = this.schedule.isOpen$.subscribe(v => (this.isOpen = v));
    this.loadFlavors();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  loadFlavors(): void {
    this.loading = true;
    this.errorMsg = null;
    this.productService.getFlavors().subscribe({
      next: (list) => {
        this.flavors = list || [];
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'No se pudieron cargar los productos.';
        this.loading = false;
      }
    });
  }

  onSelectFlavor(flavor: Flavor): void {
    if (!this.isOpen) {
      Swal.fire('Estamos cerrados', 'Vuelve dentro del horario para poder pedir.', 'info');
      return;
    }
    this.cartService.setFlavor(flavor);
    this.router.navigate(['/user/customize']);
  }

  goToHistory(): void { this.router.navigate(['/user/history']); }
  goToPoints(): void { this.router.navigate(['/user/points']); }

  logout(): void {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: 'Se limpiará tu carrito.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.authService.logout();
        this.cartService.clear();
        Swal.fire('Desconectado', 'Has cerrado sesión.', 'success');
        this.router.navigate(['/user/login']);
      }
    });
  }
}
